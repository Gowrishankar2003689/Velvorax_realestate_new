(function() {
    // Create Chat Widget HTML
    const widgetHTML = `
        <div class="chat-widget-container">
            <div id="chatBubble" class="chat-bubble">
                <i data-feather="message-square"></i>
            </div>
            <div id="chatWindow" class="chat-window">
                <div class="chat-header">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="https://api.dicebear.com/7.x/bottts/svg?seed=velvorax" style="width: 30px; height: 30px; border-radius: 50%; background: #1e293b; padding: 2px;">
                        <h3>Velvorax Assistant</h3>
                    </div>
                    <div id="closeChat" class="close-chat">
                        <i data-feather="x" style="width: 18px; height: 18px;"></i>
                    </div>
                </div>
                <div id="chatMessages" class="chat-messages">
                    <div class="message bot">
                        Hello! I'm your Velvorax Assistant. How can I help you today?
                        <div class="quick-options">
                            <button class="option-btn" data-query="What services do you offer?">Services</button>
                            <button class="option-btn" data-query="Tell me about pricing">Pricing</button>
                            <button class="option-btn" data-query="I want a free demo">Free Demo</button>
                        </div>
                    </div>
                </div>
                <form id="chatForm" class="chat-footer">
                    <input type="text" id="chatInput" class="chat-input" placeholder="Type your message...">
                    <button type="submit" class="send-btn">
                        <i data-feather="send" style="width: 16px; height: 16px;"></i>
                    </button>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', widgetHTML);

    const chatBubble = document.getElementById('chatBubble');
    const chatWindow = document.getElementById('chatWindow');
    const closeChat = document.getElementById('closeChat');
    const chatForm = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');

    // Toggle Chat
    chatBubble.addEventListener('click', () => {
        chatWindow.classList.toggle('open');
        if (chatWindow.classList.contains('open')) {
            chatInput.focus();
        }
    });

    closeChat.addEventListener('click', () => {
        chatWindow.classList.remove('open');
    });

    // Google Login Integration for Chat
    window.triggerGoogleChatLogin = function() {
        google.accounts.id.initialize({
            client_id: "112280552890-5ssj1mb581ansopn98j94trvb9bq89bd.apps.googleusercontent.com",
            callback: handleGoogleCredentialResponse
        });
        google.accounts.id.prompt(); // also display the One Tap dialog

        // Use standard button click behavior as fallback
        const parent = document.createElement('div');
        google.accounts.id.renderButton(parent, { theme: 'outline', size: 'large' });
        const googleButton = parent.querySelector('div[role="button"]');
        if (googleButton) googleButton.click();
    };

    let guestMode = false;
    let guestStep = 0;
    let guestAnswers = {};

    const guestQuestions = [
        "What is your full name?",
        "What is your company name?",
        "What is your business industry?",
        "What is your primary requirement? (e.g., Website, CRM, App)",
        "What is your estimated budget for this project?",
        "What is your project timeline? (e.g., 1 month, 3 months)",
        "Please provide your contact number.",
        "What is your business location?",
        "How did you hear about Velvorax?",
        "Would you like to schedule a free demo call?"
    ];

    async function handleGoogleCredentialResponse(response) {
        try {
            appendMessage('bot', 'Authenticating with Google...');
            const res = await fetch(`${CONFIG.API_BASE_URL}/api/auth/google-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken: response.credential })
            });

            const result = await res.json();
            if (res.ok) {
                localStorage.setItem('token', result.token);
                localStorage.setItem('velvorax_session', JSON.stringify(result.user));
                appendMessage('bot', `Welcome back, ${result.user.name}! You can now chat with me.`);
            } else {
                appendMessage('bot', `${result.msg || 'Login failed.'} <br><br><strong>Don't worry!</strong> You can still proceed as our guest. Let's start with a few details.`);
                startGuestFlow();
            }
        } catch (error) {
            console.error('Google Chat Login Error:', error);
            appendMessage('bot', 'Authentication service error. Proceeding in guest mode...');
            startGuestFlow();
        }
    }

    function startGuestFlow() {
        guestMode = true;
        guestStep = 0;
        guestAnswers = {};
        setTimeout(() => {
            appendMessage('bot', guestQuestions[guestStep]);
        }, 800);
    }

    async function handleGuestResponse(text) {
        appendMessage('user', text);
        guestAnswers[guestQuestions[guestStep]] = text;
        guestStep++;

        if (guestStep < guestQuestions.length) {
            setTimeout(() => {
                appendMessage('bot', guestQuestions[guestStep]);
            }, 600);
        } else {
            guestMode = false;
            setTimeout(() => {
                appendMessage('bot', `Thank you for providing those details! To finalize your registration and view our detailed enterprise catalog, please complete our official onboarding form: <br><br> <a href="https://velvorax-alkc.onrender.com/public_form.html?id=69fc2fa55bd0711053d8832c" target="_blank" style="color: #facc15; font-weight: bold; text-decoration: underline;">Complete Onboarding Form</a>`);
            }, 800);
        }
    }

    // Handle Quick Options
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('option-btn')) {
            const query = e.target.getAttribute('data-query');
            if (guestMode) {
                handleGuestResponse(query);
            } else {
                sendMessage(query);
            }
        }
    });

    // Handle Form Submit
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const message = chatInput.value.trim();
        if (!message) return;

        if (guestMode) {
            handleGuestResponse(message);
            chatInput.value = '';
        } else {
            sendMessage(message);
            chatInput.value = '';
        }
    });

    async function sendMessage(text) {
        // Append User Message
        appendMessage('user', text);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                appendMessage('bot', `
                    Please log in to chat with the assistant.
                    <div id="google-chat-login-container" style="margin-top: 15px;"></div>
                    <div style="margin-top: 10px;">
                        <a href="login.html" class="option-btn" style="text-decoration: none; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); color: #ffffff; border: 1px solid rgba(255,255,255,0.1); padding: 10px; border-radius: 8px; font-size: 12px;">
                            Existing Account Login
                        </a>
                    </div>
                `);

                // Render the official Google button into the message
                setTimeout(() => {
                    if (window.google && document.getElementById('google-chat-login-container')) {
                        google.accounts.id.initialize({
                            client_id: "112280552890-5ssj1mb581ansopn98j94trvb9bq89bd.apps.googleusercontent.com",
                            callback: handleGoogleCredentialResponse
                        });
                        google.accounts.id.renderButton(
                            document.getElementById('google-chat-login-container'),
                            { theme: "outline", size: "large", width: "100%", text: "continue_with" }
                        );
                    }
                }, 100);
                return;
            }

            const response = await fetch(`${CONFIG.API_BASE_URL}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ message: text })
            });

            const data = await response.json();

            if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('velvorax_session');
                appendMessage('bot', (data.msg || 'Session expired') + '. Please log in again to continue.');
                return;
            }

            if (data.success) {
                appendMessage('bot', data.reply);
            } else {
                appendMessage('bot', data.error || data.msg || 'Failed to get response.');
            }
        } catch (error) {
            console.error('Chat error:', error);
            appendMessage('bot', 'System offline. Failed to reach chat processor.');
        }
    }

    function appendMessage(sender, text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;
        msgDiv.innerHTML = text.replace(/\n/g, '<br>');
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Refresh icons if necessary
        if (window.feather) feather.replace();
    }

    // Initialize Icons
    if (window.feather) feather.replace();

})();
