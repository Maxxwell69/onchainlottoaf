// Login page functionality
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const loginBtnText = document.getElementById('loginBtnText');
    const loginBtnSpinner = document.getElementById('loginBtnSpinner');

    // Toast notification function
    function showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type} show`;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 4000);
    }

    // Handle form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const usernameOrEmail = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        if (!usernameOrEmail || !password) {
            showToast('❌ Please enter both username/email and password', 'error');
            return;
        }

        // Show loading state
        loginBtn.disabled = true;
        loginBtnText.style.display = 'none';
        loginBtnSpinner.style.display = 'inline-block';

        try {
            // Attempt login
            const result = await authManager.login(usernameOrEmail, password);
            
            if (result.success) {
                showToast('✅ Login successful! Redirecting...', 'success');
                
                // Redirect to admin dashboard after short delay
                setTimeout(() => {
                    window.location.href = '/index.html';
                }, 1000);
            } else {
                showToast(`❌ ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            showToast('❌ Login failed. Please try again.', 'error');
        } finally {
            // Reset button state
            loginBtn.disabled = false;
            loginBtnText.style.display = 'inline';
            loginBtnSpinner.style.display = 'none';
        }
    });

    // Password toggle functionality
    const passwordToggle = document.getElementById('passwordToggle');
    const passwordInput = document.getElementById('password');
    
    passwordToggle.addEventListener('click', () => {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            passwordToggle.textContent = '🙈';
        } else {
            passwordInput.type = 'password';
            passwordToggle.textContent = '👁️';
        }
    });

    // Check if user is already logged in
    if (authManager.isAuthenticated()) {
        // Redirect to admin dashboard
        window.location.href = '/index.html';
    }

    // Add some visual feedback for form inputs
    const inputs = document.querySelectorAll('input[type="text"], input[type="password"]');
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            input.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', () => {
            if (!input.value) {
                input.parentElement.classList.remove('focused');
            }
        });
    });
});
