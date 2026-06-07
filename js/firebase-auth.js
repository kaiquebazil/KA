/* ============================================================
   KB Tech KOS - Firebase Authentication
   ============================================================ */

(function() {
    var firebaseReady = false;
    var auth = null;

    function hasConfig() {
        var cfg = window.KOS_FIREBASE_CONFIG || {};
        return !!(cfg.apiKey && cfg.authDomain && cfg.projectId && cfg.appId);
    }

    function init() {
        if (!hasConfig() || !window.firebase || firebaseReady) return firebaseReady;

        try {
            if (!firebase.apps.length) firebase.initializeApp(window.KOS_FIREBASE_CONFIG);
            auth = firebase.auth();
            firebaseReady = true;
        } catch (err) {
            console.warn('Firebase Auth indisponivel. Login local temporario ativo.', err);
            firebaseReady = false;
        }

        return firebaseReady;
    }

    function isConfigured() {
        return hasConfig();
    }

    function isReady() {
        return init();
    }

    function currentUser() {
        return init() && auth ? auth.currentUser : null;
    }

    async function login(email, password) {
        if (!init() || !auth) throw new Error('Firebase Auth nao configurado');
        return auth.signInWithEmailAndPassword(email, password);
    }

    async function logout() {
        if (init() && auth) await auth.signOut();
    }

    function onAuthStateChanged(callback) {
        if (!init() || !auth) {
            callback(null);
            return function() {};
        }

        return auth.onAuthStateChanged(callback);
    }

    function statusText() {
        if (!hasConfig()) return 'Local';
        if (!firebaseReady) return 'Firebase pendente';
        if (!currentUser()) return 'Aguardando login';
        return 'Firebase';
    }

    window.KOSAuth = {
        isConfigured: isConfigured,
        isReady: isReady,
        currentUser: currentUser,
        login: login,
        logout: logout,
        onAuthStateChanged: onAuthStateChanged,
        statusText: statusText
    };
})();

