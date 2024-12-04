-- System metrics table
create table if not exists public.system_metrics (
    id uuid default uuid_generate_v4() primary key,
    metric_type text not null check (metric_type in ('vault_balance', 'user_count', 'transaction_volume', 'active_challenges', 'system_health')) unique,
    value numeric not null,
    metadata jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Alert configurations table
create table if not exists public.alert_configs (
    id uuid default uuid_generate_v4() primary key,
    metric_type text not null references system_metrics(metric_type),
    threshold numeric not null,
    condition text not null check (condition in ('above', 'below', 'equals')),
    severity text not null check (severity in ('info', 'warning', 'critical', 'emergency')),
    enabled boolean not null default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Alert history table
create table if not exists public.alert_history (
    id uuid default uuid_generate_v4() primary key,
    config_id uuid references alert_configs(id) on delete set null,
    metric_type text not null,
    metric_value numeric not null,
    threshold numeric not null,
    severity text not null,
    status text not null check (status in ('triggered', 'acknowledged', 'resolved')),
    resolved_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.system_metrics enable row level security;
alter table public.alert_configs enable row level security;
alter table public.alert_history enable row level security;

-- RLS Policies
create policy "System metrics are viewable by authenticated users"
on public.system_metrics for select
to authenticated
using (true);

create policy "Only admins can insert system metrics"
on public.system_metrics for insert
to authenticated
with check (exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role = 'admin'
));

create policy "Alert configs are viewable by authenticated users"
on public.alert_configs for select
to authenticated
using (true);

create policy "Only admins can manage alert configs"
on public.alert_configs for all
to authenticated
using (exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role = 'admin'
));

create policy "Alert history is viewable by authenticated users"
on public.alert_history for select
to authenticated
using (true);

create policy "Only admins can manage alert history"
on public.alert_history for all
to authenticated
using (exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role = 'admin'
));

-- Functions
create or replace function public.record_metric(
    p_metric_type text,
    p_value numeric,
    p_metadata jsonb default null
) returns uuid
security definer
as $$
declare
    v_metric_id uuid;
    v_alert_config alert_configs%rowtype;
    v_alert_id uuid;
begin
    -- Record metric
    insert into public.system_metrics (metric_type, value, metadata)
    values (p_metric_type, p_value, p_metadata)
    returning id into v_metric_id;

    -- Check alerts
    for v_alert_config in
        select * from public.alert_configs
        where metric_type = p_metric_type
        and enabled = true
    loop
        -- Check if alert should be triggered
        if (v_alert_config.condition = 'above' and p_value > v_alert_config.threshold)
        or (v_alert_config.condition = 'below' and p_value < v_alert_config.threshold)
        or (v_alert_config.condition = 'equals' and p_value = v_alert_config.threshold)
        then
            -- Create alert
            insert into public.alert_history (
                config_id,
                metric_type,
                metric_value,
                threshold,
                severity,
                status
            )
            values (
                v_alert_config.id,
                p_metric_type,
                p_value,
                v_alert_config.threshold,
                v_alert_config.severity,
                'triggered'
            )
            returning id into v_alert_id;
        end if;
    end loop;

    return v_metric_id;
end;
$$ language plpgsql;

-- Function to get system health status
create or replace function public.get_system_health()
returns table (
    metric_type text,
    current_value numeric,
    alert_count bigint,
    last_alert_severity text,
    last_alert_time timestamp with time zone
)
security definer
as $$
begin
    return query
    select 
        m.metric_type,
        m.value as current_value,
        count(distinct ah.id) as alert_count,
        max(ah.severity) as last_alert_severity,
        max(ah.created_at) as last_alert_time
    from system_metrics m
    left join alert_history ah 
        on ah.metric_type = m.metric_type 
        and ah.status != 'resolved'
        and ah.created_at > now() - interval '24 hours'
    where m.created_at = (
        select max(created_at)
        from system_metrics m2
        where m2.metric_type = m.metric_type
    )
    group by m.metric_type, m.value;
end;
$$ language plpgsql; 