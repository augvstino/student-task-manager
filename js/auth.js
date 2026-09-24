// Handles sign up / sign in / sign out and toggling between the
// auth screen and the app screen based on session state.

const authScreen = document.getElementById('authScreen');
const appScreen = document.getElementById('appScreen');
const authForm = document.getElementById('authForm');
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const authMsg = document.getElementById('authMsg');
const signUpBtn = document.getElementById('signUpBtn');
const signOutBtn = document.getElementById('signOutBtn');
const userEmailLabel = document.getElementById('userEmail');

function showAuthMessage(text, isOk) {
  authMsg.textContent = text;
  authMsg.className = 'auth-msg' + (isOk ? ' ok' : '');
}

function showApp(session) {
  authScreen.style.display = 'none';
  appScreen.style.display = 'block';
  userEmailLabel.textContent = session.user.email;
  if (window.onAuthReady) window.onAuthReady(session);
}

function showAuth() {
  authScreen.style.display = 'block';
  appScreen.style.display = 'none';
}

// Sign in (default submit action)
authForm.addEventListener('submit', async function (e) {
  e.preventDefault();
  showAuthMessage('signing in…', true);
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: emailInput.value.trim(),
    password: passwordInput.value
  });
  if (error) {
    showAuthMessage(error.message, false);
    return;
  }
  showAuthMessage('', true);
});

// Sign up
signUpBtn.addEventListener('click', async function () {
  showAuthMessage('creating account…', true);
  const { data, error } = await supabaseClient.auth.signUp({
    email: emailInput.value.trim(),
    password: passwordInput.value
  });
  if (error) {
    showAuthMessage(error.message, false);
    return;
  }
  if (data.session) {
    showAuthMessage('', true);
  } else {
    showAuthMessage('check your email to confirm your account, then sign in.', true);
  }
});

// Sign out
signOutBtn.addEventListener('click', async function () {
  await supabaseClient.auth.signOut();
});

// React to auth state changes (covers initial load + sign in/out)
supabaseClient.auth.onAuthStateChange(function (_event, session) {
  if (session) {
    showApp(session);
  } else {
    showAuth();
  }
});