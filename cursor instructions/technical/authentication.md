## Authentication Architecture

### Components
- AuthService: Manages authentication state
- WalletConnector: Handles wallet connections
- SessionManager: Manages user sessions
- RoleManager: Handles role-based access

### Authentication Flow

1. Signup with email

2. Wallet Connection optional
   - Support for Yours Wallet
   - WalletConnect integration
   - Address validation

3. User Recognition
   - Address mapping
   - Profile creation
   - Session establishment

4. Role Assignment
   - Default: guest
   - Verified: user
   - Premium: member
   - Special: moderator/admin

### Security Features
- Message signing
- Session encryption
- Rate limiting
- Activity logging