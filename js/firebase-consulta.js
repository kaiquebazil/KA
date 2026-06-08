/* ============================================================
   KB Tech - consulta publica no Firestore com fallback local
   ============================================================ */

(function() {
    var db = null;
    var ready = false;

    function hasConfig() {
        var cfg = window.KOS_FIREBASE_CONFIG || {};
        return !!(cfg.apiKey && cfg.authDomain && cfg.projectId && cfg.appId);
    }

    function initFirebase() {
        if (ready) return true;
        if (!hasConfig() || !window.firebase) return false;

        try {
            if (!firebase.apps.length) firebase.initializeApp(window.KOS_FIREBASE_CONFIG);
            db = firebase.firestore();
            ready = true;
            return true;
        } catch (error) {
            console.warn('Consulta Firebase indisponivel. Usando localStorage como fallback.', error);
            ready = false;
            return false;
        }
    }

    function normalizeNumber(value) {
        return String(value || '').replace(/[^0-9]/g, '');
    }

    function matchesNumber(record, number) {
        var queryNumber = normalizeNumber(number);
        var possibleNumbers = [
            record.id,
            record.numero,
            record.numeroOS,
            record.numeroOrdem,
            record.numeroGarantia,
            record.numeroPedido,
            record.pedidoNumero,
            record.orderNumber,
            record.orderId,
            record.pedidoId,
            record.codigo
        ];

        for (var i = 0; i < possibleNumbers.length; i++) {
            var current = normalizeNumber(possibleNumbers[i]);
            if (current && (current === queryNumber || current.slice(-4) === queryNumber || current.slice(-6) === queryNumber)) {
                return true;
            }
        }
        return false;
    }

    async function findByFields(collectionName, fields, number) {
        if (!initFirebase() || !db) return null;
        var normalized = normalizeNumber(number);
        var variants = [normalized];
        if (!Number.isNaN(Number(normalized))) variants.push(Number(normalized));

        for (var i = 0; i < fields.length; i++) {
            for (var j = 0; j < variants.length; j++) {
                try {
                    var snapshot = await db.collection(collectionName).where(fields[i], '==', variants[j]).limit(1).get();
                    if (!snapshot.empty) {
                        var docItem = snapshot.docs[0];
                        return Object.assign({ id: docItem.id }, docItem.data());
                    }
                } catch (error) {
                    console.warn('Consulta por campo falhou no Firebase. Tentando fallback.', error);
                }
            }
        }
        return null;
    }

    async function findByScan(collectionName, number) {
        if (!initFirebase() || !db) return null;

        try {
            var snapshot = await db.collection(collectionName).get();
            var found = null;
            snapshot.forEach(function(docItem) {
                if (found) return;
                var data = Object.assign({ id: docItem.id }, docItem.data());
                if (matchesNumber(data, number)) found = data;
            });
            return found;
        } catch (error) {
            console.warn('Consulta geral falhou no Firebase. Usando localStorage como fallback.', error);
            return null;
        }
    }

    async function getOSFromFirebase(number) {
        var direct = await findByFields('ordensServico', ['numeroOS', 'numero', 'codigo'], number);
        return direct || findByScan('ordensServico', number);
    }

    async function getGuaranteeFromFirebase(number) {
        var direct = await findByFields('garantias', ['numeroGarantia', 'numero', 'codigo'], number);
        return direct || findByScan('garantias', number);
    }

    async function getOrderFromFirebase(number) {
        var direct = await findByFields('pedidos', ['numeroPedido', 'pedidoNumero', 'numero', 'codigo', 'orderNumber'], number);
        return direct || findByScan('pedidos', number);
    }

    async function getDeliveryFromFirebase(number) {
        var direct = await findByFields('entregas', ['numeroPedido', 'pedidoNumero', 'pedidoId', 'orderId', 'numero', 'codigo'], number);
        return direct || findByScan('entregas', number);
    }

    async function getOrderDeliveryFromFirebase(number) {
        var order = await getOrderFromFirebase(number);
        var delivery = await getDeliveryFromFirebase(number);

        if (order && !delivery) {
            var orderNumber = order.numeroPedido || order.pedidoNumero || order.numero || order.codigo || order.id;
            delivery = await getDeliveryFromFirebase(orderNumber);
        }

        if (delivery && !order) {
            var deliveryOrderNumber = delivery.numeroPedido || delivery.pedidoNumero || delivery.pedidoId || delivery.orderId || delivery.numero || delivery.codigo;
            order = await getOrderFromFirebase(deliveryOrderNumber);
        }

        if (!order && !delivery) return null;
        return { pedido: order, entrega: delivery };
    }

    window.KBTFirebaseConsulta = {
        getOSFromFirebase: getOSFromFirebase,
        getGuaranteeFromFirebase: getGuaranteeFromFirebase,
        getOrderDeliveryFromFirebase: getOrderDeliveryFromFirebase
    };
})();
