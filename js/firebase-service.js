/* ============================================================
   KB Tech KOS - Firebase + fallback local
   ============================================================ */

(function() {
    var firebaseReady = false;
    var auth = null;
    var db = null;
    var cacheReady = false;

    var collectionMap = {
        products: { collection: 'produtos', localKey: 'katech_products' },
        suppliers: { collection: 'fornecedores', localKey: 'kaos_suppliers' },
        supplierPurchases: { collection: 'comprasFornecedores', localKey: 'kaos_supplier_purchases' },
        stockMovements: { collection: 'movimentacoesEstoque', localKey: 'kaos_stock_movements' },
        customers: { collection: 'clientes', localKey: 'kaos_customers' },
        os: { collection: 'ordensServico', localKey: 'kaos_os' },
        guarantees: { collection: 'garantias', localKey: 'kaos_guarantees' },
        quotes: { collection: 'orcamentos', localKey: 'kaos_quotes' },
        finance: { collection: 'financeiro', localKey: 'kaos_finance' },
        documents: { collection: 'documentos', localKey: 'kaos_documents' },
        officialNotes: { collection: 'notasOficiais', localKey: 'kaos_official_notes' },
        settings: { collection: 'configuracoes', localKey: 'kaos_settings', docId: 'kos' },
        shipping: { collection: 'configuracoes', localKey: 'katech_shipping', docId: 'frete' },
        orders: { collection: 'pedidos', localKey: 'katech_orders' },
        deliveries: { collection: 'entregas', localKey: 'kaos_deliveries' }
    };

    function hasConfig() {
        var cfg = window.KOS_FIREBASE_CONFIG || {};
        return !!(cfg.apiKey && cfg.authDomain && cfg.projectId && cfg.appId);
    }

    function safeParse(key, fallback) {
        try {
            return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback || []));
        } catch (err) {
            return fallback || [];
        }
    }

    function setLocal(domain, data) {
        var meta = collectionMap[domain];
        if (!meta) return;
        localStorage.setItem(meta.localKey, JSON.stringify(data || []));
    }

    function getLocal(domain) {
        var meta = collectionMap[domain];
        if (!meta) return [];
        return safeParse(meta.localKey, []);
    }

    function normalizeId(item, docId) {
        var data = Object.assign({}, item);
        if (data.id === undefined || data.id === null || data.id === '') data.id = docId;
        return data;
    }

    function init() {
        if (!hasConfig() || !window.firebase || firebaseReady) return firebaseReady;
        try {
            if (!firebase.apps.length) firebase.initializeApp(window.KOS_FIREBASE_CONFIG);
            auth = firebase.auth();
            db = firebase.firestore();
            firebaseReady = true;
        } catch (err) {
            console.warn('Firebase indisponivel, usando dados locais.', err);
            firebaseReady = false;
        }
        return firebaseReady;
    }

    function isConfigured() {
        return hasConfig();
    }

    function isOnline() {
        return init() && auth && auth.currentUser;
    }

    function statusText() {
        if (!hasConfig()) return 'Local';
        if (!firebaseReady) return 'Firebase pendente';
        if (!auth || !auth.currentUser) return 'Aguardando login';
        return 'Firebase';
    }

    async function login(email, password) {
        if (!init()) throw new Error('Firebase nao configurado');
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

    async function fetchCollection(domain) {
        var meta = collectionMap[domain];
        if (!meta || !isOnline()) return getLocal(domain);

        if (meta.docId) {
            var doc = await db.collection(meta.collection).doc(meta.docId).get();
            var data = doc.exists ? (doc.data().items || []) : getLocal(domain);
            setLocal(domain, data);
            return data;
        }

        var snapshot = await db.collection(meta.collection).get();
        var list = [];
        snapshot.forEach(function(doc) {
            list.push(normalizeId(doc.data(), doc.id));
        });
        setLocal(domain, list);
        return list;
    }

    async function saveCollection(domain, data) {
        setLocal(domain, data);
        var meta = collectionMap[domain];
        if (!meta || !isOnline()) return { source: 'local' };

        try {
            if (meta.docId) {
                await db.collection(meta.collection).doc(meta.docId).set({
                    items: data || [],
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
                return { source: 'firebase' };
            }

            var batch = db.batch();
            var existing = await db.collection(meta.collection).get();
            existing.forEach(function(doc) {
                batch.delete(doc.ref);
            });
            (data || []).forEach(function(item) {
                var id = String(item.id || Date.now() + '-' + Math.random().toString(16).slice(2));
                batch.set(db.collection(meta.collection).doc(id), Object.assign({}, item, {
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                }));
            });
            await batch.commit();
            return { source: 'firebase' };
        } catch (err) {
            console.warn('Falha ao salvar no Firebase, dados mantidos localmente.', err);
            return { source: 'local', error: err };
        }
    }

    async function syncAllToLocal() {
        if (!isOnline()) return false;
        var domains = Object.keys(collectionMap);
        for (var i = 0; i < domains.length; i++) {
            try {
                await fetchCollection(domains[i]);
            } catch (err) {
                console.warn('Falha ao sincronizar ' + domains[i], err);
            }
        }
        cacheReady = true;
        return true;
    }

    async function importBackup(data) {
        var pairs = {
            products: data.products,
            suppliers: data.suppliers || data.fornecedores,
            supplierPurchases: data.supplierPurchases || data.comprasFornecedores,
            stockMovements: data.stockMovements || data.movimentacoesEstoque,
            customers: data.customers,
            os: data.os,
            guarantees: data.guarantees,
            quotes: data.quotes,
            finance: data.finance,
            documents: data.documents,
            officialNotes: data.officialNotes,
            settings: data.settings,
            shipping: data.shipping,
            orders: data.orders,
            deliveries: data.deliveries || data.entregas
        };
        var keys = Object.keys(pairs);
        for (var i = 0; i < keys.length; i++) {
            if (pairs[keys[i]]) await saveCollection(keys[i], pairs[keys[i]]);
        }
    }

    window.KOSData = {
        isConfigured: isConfigured,
        isOnline: isOnline,
        isCacheReady: function() { return cacheReady; },
        statusText: statusText,
        login: login,
        logout: logout,
        onAuthStateChanged: onAuthStateChanged,
        getLocal: getLocal,
        setLocal: setLocal,
        fetchCollection: fetchCollection,
        saveCollection: saveCollection,
        syncAllToLocal: syncAllToLocal,
        importBackup: importBackup
    };
})();
