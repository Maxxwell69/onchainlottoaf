// Registration page functionality
document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const registerBtn = document.getElementById('registerBtn');
    const registerBtnText = document.getElementById('registerBtnText');
    const registerBtnSpinner = document.getElementById('registerBtnSpinner');

    // Toast notification function
    function showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type} show`;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 4000);
    }

    // Validate form
    function validateForm() {
        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const agreeTerms = document.getElementById('agreeTerms').checked;

        // Clear previous errors
        document.querySelectorAll('.error-message').forEach(el => el.remove());
        document.querySelectorAll('.form-group').forEach(el => el.classList.remove('error'));

        let isValid = true;

        // Username validation
        if (!username) {
            showFieldError('username', 'Username is required');
            isValid = false;
        } else if (username.length < 3) {
            showFieldError('username', 'Username must be at least 3 characters');
            isValid = false;
        } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            showFieldError('username', 'Username can only contain letters, numbers, and underscores');
            isValid = false;
        }

        // Email validation (optional)
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showFieldError('email', 'Please enter a valid email address');
            isValid = false;
        }

        // Password validation
        if (!password) {
            showFieldError('password', 'Password is required');
            isValid = false;
        } else if (password.length < 6) {
            showFieldError('password', 'Password must be at least 6 characters');
            isValid = false;
        }

        // Confirm password validation
        if (!confirmPassword) {
            showFieldError('confirmPassword', 'Please confirm your password');
            isValid = false;
        } else if (password !== confirmPassword) {
            showFieldError('confirmPassword', 'Passwords do not match');
            isValid = false;
        }

        // Terms agreement validation
        if (!agreeTerms) {
            showToast('❌ Please agree to the Terms of Service and Privacy Policy', 'error');
            isValid = false;
        }

        return isValid;
    }

    // Show field error
    function showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const formGroup = field.closest('.form-group');
        
        formGroup.classList.add('error');
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        formGroup.appendChild(errorDiv);
    }

    // Handle form submission
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        // Show loading state
        registerBtn.disabled = true;
        registerBtnText.style.display = 'none';
        registerBtnSpinner.style.display = 'inline-block';

        try {
            // Attempt registration
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    email: email || null,
                    password
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                showToast('✅ Registration successful! Your account is pending admin approval.', 'success');
                
                // Clear form
                registerForm.reset();
                
                // Redirect to login page after delay
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 2000);
            } else {
                showToast(`❌ ${data.error}`, 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            showToast('❌ Registration failed. Please try again.', 'error');
        } finally {
            // Reset button state
            registerBtn.disabled = false;
            registerBtnText.style.display = 'inline';
            registerBtnSpinner.style.display = 'none';
        }
    });

    // Real-time validation
    document.getElementById('username').addEventListener('input', (e) => {
        const username = e.target.value.trim();
        if (username.length > 0 && username.length < 3) {
            e.target.style.borderColor = 'var(--danger)';
        } else if (username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(username)) {
            e.target.style.borderColor = 'var(--success)';
        } else {
            e.target.style.borderColor = 'var(--border)';
        }
    });

    document.getElementById('password').addEventListener('input', (e) => {
        const password = e.target.value;
        if (password.length > 0 && password.length < 6) {
            e.target.style.borderColor = 'var(--danger)';
        } else if (password.length >= 6) {
            e.target.style.borderColor = 'var(--success)';
        } else {
            e.target.style.borderColor = 'var(--border)';
        }
    });

    document.getElementById('confirmPassword').addEventListener('input', (e) => {
        const password = document.getElementById('password').value;
        const confirmPassword = e.target.value;
        
        if (confirmPassword.length > 0) {
            if (password === confirmPassword) {
                e.target.style.borderColor = 'var(--success)';
            } else {
                e.target.style.borderColor = 'var(--danger)';
            }
        } else {
            e.target.style.borderColor = 'var(--border)';
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

    // Confirm password toggle functionality
    const confirmPasswordToggle = document.getElementById('confirmPasswordToggle');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    confirmPasswordToggle.addEventListener('click', () => {
        if (confirmPasswordInput.type === 'password') {
            confirmPasswordInput.type = 'text';
            confirmPasswordToggle.textContent = '🙈';
        } else {
            confirmPasswordInput.type = 'password';
            confirmPasswordToggle.textContent = '👁️';
        }
    });

    // Check if user is already logged in
    if (authManager.isAuthenticated()) {
        // Redirect to admin dashboard
        window.location.href = '/index.html';
    }
});
