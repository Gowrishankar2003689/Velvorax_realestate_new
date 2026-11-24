// const VelvoraxAuth = {

//     init() {
//         // Lazy init only
//     },

//     async login(email, password, selectedRole) {

//         try {

//             // LOGIN URL BASED ON ROLE
//             let loginUrl = '/api/auth/login';

//             if (selectedRole === 'staff') {
//                 loginUrl = '/api/user-auth/login';
//             }

//             const response = await fetch(
//                 CONFIG.API_BASE_URL + loginUrl,
//                 {
//                     method: 'POST',
//                     headers: {
//                         'Content-Type': 'application/json'
//                     },
//                     body: JSON.stringify({
//                         email,
//                         password,
//                         platform: 'web'
//                     })
//                 }
//             );

//             const responseText = await response.text();
//             let result;
//             try {
//                 result = JSON.parse(responseText);
//             } catch (parseErr) {
//                 console.error('Failed to parse JSON response:', responseText);
//                 return {
//                     success: false,
//                     message: 'Invalid response from server. Check console for details.'
//                 };
//             }

//             console.log('LOGIN RESULT:', result);

//             if (response.ok) {

//                 // SAVE USER
//                 localStorage.setItem(
//                     'velvorax_session',
//                     JSON.stringify(result.user)
//                 );

//                 // SAVE TOKEN
//                 localStorage.setItem(
//                     'token',
//                     result.token
//                 );

//                 return {
//                     success: true,
//                     user: result.user
//                 };

//             }

//             return {
//                 success: false,
//                 message: result.msg || 'Invalid credentials.'
//             };

//         } catch (err) {

//             console.error('Login error:', err);

//             return {
//                 success: false,
//                 message: 'Server connection failed.'
//             };

//         }

//     },

//     getUser() {

//         const user =
//             localStorage.getItem('velvorax_session');

//         return user
//             ? JSON.parse(user)
//             : null;

//     },

//     getCurrentUser() {

//         return this.getUser();

//     },

//     isAuthenticated(requiredRole) {

//         const authenticated =
//             !!localStorage.getItem('token');

//         if (!authenticated)
//             return false;

//         if (!requiredRole)
//             return true;

//         return this.hasRole(requiredRole);

//     },

//     hasRole(requiredRole) {

//         const user = this.getUser();

//         if (!user)
//             return false;

//         if (Array.isArray(requiredRole)) {

//             return requiredRole.includes(user.role);

//         }

//         return user.role === requiredRole;

//     },

//     async clearSessions(email, password, selectedRole) {
//         try {
//             let clearUrl = '/api/auth/clear-sessions';
//             if (selectedRole === 'staff') {
//                 clearUrl = '/api/user-auth/clear-sessions';
//             }

//             const response = await fetch(
//                 CONFIG.API_BASE_URL + clearUrl,
//                 {
//                     method: 'POST',
//                     headers: {
//                         'Content-Type': 'application/json'
//                     },
//                     body: JSON.stringify({ email, password })
//                 }
//             );

//             const responseText = await response.text();
//             let result;
//             try {
//                 result = JSON.parse(responseText);
//             } catch (parseErr) {
//                 console.error('Failed to parse JSON response:', responseText);
//                 return { success: false, message: 'Invalid response from server.' };
//             }

//             if (response.ok) {
//                 return { success: true, message: result.msg };
//             }

//             return { success: false, message: result.msg || 'Failed to clear sessions.' };
//         } catch (err) {
//             console.error('Clear sessions error:', err);
//             return { success: false, message: 'Server connection failed.' };
//         }
//     },

//     async logout() {
//         try {
//             const token = localStorage.getItem('token');
//             if (token) {
//                 const user = this.getUser();
//                 const logoutUrl = user && user.role === 'staff' ? '/api/user-auth/logout' : '/api/auth/logout';

//                 await fetch(CONFIG.API_BASE_URL + logoutUrl, {
//                     method: 'POST',
//                     headers: {
//                         'Content-Type': 'application/json',
//                         'Authorization': `Bearer ${token}`
//                     },
//                     body: JSON.stringify({ platform: 'web' })
//                 });
//             }
//         } catch (err) {
//             console.error('Logout API error:', err);
//         }

//         localStorage.clear();
//         window.location.href = 'login.html';
//     }

// };

// // INITIALIZE
// VelvoraxAuth.init();

const VelvoraxAuth = {

    // INITIALIZATION
    init() {
        console.log("Velvorax Authentication Initialized");
    },

    // STATIC LOGIN
    async login(username, password, selectedRole) {

        try {

            // STATIC CREDENTIALS
            const STATIC_USERNAME = "gowri@123";
            const STATIC_PASSWORD = "123";

            // CHECK LOGIN CREDENTIALS
            if (
                username.trim() === STATIC_USERNAME &&
                password === STATIC_PASSWORD
            ) {

                // CREATE STANDARD USER
                const user = {
                    id: 1,
                    username: "gowri",
                    name: "Gowri",
                    email: STATIC_USERNAME,
                    role: "user"
                };

                // SAVE USER SESSION
                localStorage.setItem(
                    "velvorax_session",
                    JSON.stringify(user)
                );

                // SAVE STATIC TOKEN
                localStorage.setItem(
                    "token",
                    "static-user-token"
                );

                console.log("Login Successful:", user);

                return {
                    success: true,
                    user: user,
                    message: "Login successful"
                };

            }

            // INVALID CREDENTIALS
            return {
                success: false,
                message: "Invalid username or password."
            };

        } catch (err) {

            console.error("Login Error:", err);

            return {
                success: false,
                message: "Something went wrong."
            };

        }

    },

    // GET LOGGED-IN USER
    getUser() {

        const user = localStorage.getItem(
            "velvorax_session"
        );

        if (!user) {
            return null;
        }

        try {
            return JSON.parse(user);
        } catch (err) {
            console.error("Invalid user session:", err);
            return null;
        }

    },

    // GET CURRENT USER
    getCurrentUser() {

        return this.getUser();

    },

    // CHECK AUTHENTICATION
    isAuthenticated(requiredRole) {

        const authenticated =
            !!localStorage.getItem("token");

        if (!authenticated) {
            return false;
        }

        if (!requiredRole) {
            return true;
        }

        return this.hasRole(requiredRole);

    },

    // CHECK USER ROLE
    hasRole(requiredRole) {

        const user = this.getUser();

        if (!user) {
            return false;
        }

        if (Array.isArray(requiredRole)) {

            return requiredRole.includes(user.role);

        }

        return user.role === requiredRole;

    },

    // CLEAR SESSIONS
    async clearSessions() {

        localStorage.removeItem("velvorax_session");
        localStorage.removeItem("token");

        return {
            success: true,
            message: "Session cleared successfully."
        };

    },

    // LOGOUT
    async logout() {

        // REMOVE LOGIN SESSION
        localStorage.removeItem("velvorax_session");
        localStorage.removeItem("token");

        console.log("User logged out successfully");

        // REDIRECT TO LOGIN PAGE
        window.location.href = "login.html";

    }

};

// INITIALIZE AUTHENTICATION
VelvoraxAuth.init();
