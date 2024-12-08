# Meta Salon React

## Stable Versions

### v1.1.0-stable - Profile Settings Milestone
- Working profile settings with balance persistence
- Stable token balance system
- Improved session handling
- Fixed auth callback issues

To restore to this version:
1. Git: `git checkout v1.1.0-stable`
2. Database: Run `scripts/restore_v1.1.0.sh`

### v1.0.0-stable - Initial Release
- Basic functionality
- Token system
- Vote packs
- User authentication

## Development Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Copy `.env.example` to `.env` and fill in the values.

3. Start development server:
```bash
npm run dev
```

## Database Backups

Backup scripts are available in the `scripts/` directory:
- `backup_v1.1.0.sql` - Profile Settings Milestone
- `backup_v1.0.0.sql` - Initial Release

To restore a backup:
```bash
./scripts/restore_v1.1.0.sh  # For v1.1.0
./scripts/restore_v1.0.0.sh  # For v1.0.0
```