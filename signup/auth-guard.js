/**
 * auth-guard.js
 * FRONTEND ONLY MODE
 * Redirects to login if local storage shows no login state.
 */
(function () {
  'use strict';

  const LOGIN_PAGE = '/signup/signup.html';

  function getLoginPath() {
    const depth = window.location.pathname.split('/').filter(Boolean).length;
    const prefix = depth <= 1 ? '.' : Array(depth).fill('..').join('/');
    return prefix + LOGIN_PAGE;
  }

  function redirectToLogin() {
    window.location.replace(getLoginPath());
  }

  function clearTokens() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isLoggedIn');
  }

  function runAuthGuard() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
      clearTokens();
      redirectToLogin();
      return;
    }

    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        window.__currentUser = JSON.parse(userStr);
      } catch (err) {
        window.__currentUser = null;
      }
    }
  }

  window.authLogout = function (redirectAfter = true) {
    clearTokens();
    if (redirectAfter) redirectToLogin();
  };

  window.apiRequest = async function () {
    return {
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: 'Mocked frontend response' })
    };
  };

  runAuthGuard();
})();