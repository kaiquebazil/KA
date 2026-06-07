/* ============================================================
   KB Tech - admin.js
   Lógica do painel administrativo - CORRIGIDO
   ============================================================ */

var ADMIN_PASSWORD = 'katech2024';
var ADMIN_SESSION_KEY = 'katech_admin_session';

// Autenticacao
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin JS carregado');

    updateFirebaseStatus();
    if (window.KOSAuth && window.KOSAuth.isConfigured()) {
        window.KOSAuth.onAuthStateChanged(function(user) {
            if (user) {
                sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
                syncFirebaseThenShow();
            } else {
                sessionStorage.removeItem(ADMIN_SESSION_KEY);
                document.getElementById('login-screen').style.display = 'flex';
                document.getElementById('admin-panel').style.display = 'none';
            }
        });
    } else if (sessionStorage.getItem(ADMIN_SESSION_KEY) === '1') {
        showAdminPanel();
    }

    var loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            var emailEl = document.getElementById('admin-email');
            var email = emailEl ? emailEl.value.trim() : '';
            var pwd = document.getElementById('admin-password').value;
            if (window.KOSAuth && window.KOSAuth.isConfigured()) {
                try {
                    await window.KOSAuth.login(email, pwd);
                    await syncFirebaseThenShow();
                } catch (err) {
                    var firebaseErr = document.getElementById('login-error');
                    if (firebaseErr) firebaseErr.style.display = 'flex';
                }
                return;
            }
            if (pwd === ADMIN_PASSWORD) {
                sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
                showAdminPanel();
            } else {
                var errEl = document.getElementById('login-error');
                if (errEl) errEl.style.display = 'flex';
                document.getElementById('admin-password').value = '';
                document.getElementById('admin-password').focus();
            }
        });
    }

    var togglePassword = document.getElementById('toggle-password');
    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            var pwdInput = document.getElementById('admin-password');
            var icon = togglePassword.querySelector('i');
            if (pwdInput.type === 'password') {
                pwdInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                pwdInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    }

    var btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', async function() {
            sessionStorage.removeItem(ADMIN_SESSION_KEY);
            if (window.KOSAuth) await window.KOSAuth.logout();
            location.reload();
        });
    }
    
    // Menu mobile toggle
    var menuToggle = document.getElementById('admin-menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            document.body.classList.toggle('sidebar-mobile-open');
            updateMobileMenuButton();
        });
    }

    var adminMain = document.querySelector('.admin-main');
    if (adminMain) {
        adminMain.addEventListener('click', function() {
            if (window.innerWidth <= 768 && document.body.classList.contains('sidebar-mobile-open')) {
                document.body.classList.remove('sidebar-mobile-open');
                updateMobileMenuButton();
            }
        });
    }
});

async function syncFirebaseThenShow() {
    if (window.KOSData && window.KOSData.isOnline()) {
        await window.KOSData.syncAllToLocal();
    }
    updateFirebaseStatus();
    showAdminPanel();
}

function updateFirebaseStatus() {
    var el = document.getElementById('firebase-status');
    if (el && window.KOSAuth) {
        el.innerHTML = '<i class="fas fa-database"></i> ' + window.KOSAuth.statusText();
    } else if (el && window.KOSData) {
        el.innerHTML = '<i class="fas fa-database"></i> ' + window.KOSData.statusText();
    }
}

function updateMobileMenuButton() {
    var menuToggle = document.getElementById('admin-menu-toggle');
    if (!menuToggle) return;
    var isOpen = document.body.classList.contains('sidebar-mobile-open');
    menuToggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
    menuToggle.innerHTML = isOpen
        ? '<i class="fas fa-times"></i><span>Fechar</span>'
        : '<i class="fas fa-bars"></i><span>Menu</span>';
}

function showAdminPanel() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'flex';
    initAdminPanel();
}

function initAdminPanel() {
    console.log('Inicializando admin panel');
    ensureReportsTab();
    ensureFinanceSummaryBlocks();
    ensureFiscalModule();
    initAdminTabs();
    renderDashboard();
    renderAdminProducts();
    renderCustomers();
    renderOS();
    renderGuarantees();
    renderQuotes();
    renderFinance();
    renderPartners();
    renderDocuments();
    renderOfficialNotes();
    renderMeiControl();
    renderAdminShipping();
    renderAdminOrders();
    renderReports();
    
    initProductModal();
    initCustomerModal();
    initOSModal();
    initQuoteModal();
    ensureFinanceModalFields();
    initFinanceModal();
    initShippingModal();
    initKaosSystem();
    initBackupSystem();
    initResetCatalog();
    initClearOrders();
    initReports();
    initFinanceFilters();
    initFiscalActions();

    var searchInput = document.getElementById('admin-search');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            renderAdminProducts(e.target.value);
        });
    }
    
    var customerSearch = document.getElementById('customer-search');
    if (customerSearch) {
        customerSearch.addEventListener('input', function(e) {
            renderCustomers(e.target.value);
        });
    }
    
    var guaranteeSearch = document.getElementById('guarantee-search');
    if (guaranteeSearch) {
        guaranteeSearch.addEventListener('input', function(e) {
            renderGuarantees(e.target.value);
        });
    }
}

function showAdminToast(msg, type) {
    type = type || 'success';
    var toast = document.getElementById('admin-toast');
    if (!toast) { 
        toast = document.createElement('div'); 
        toast.id = 'admin-toast'; 
        toast.className = 'toast-notification'; 
        document.body.appendChild(toast); 
    }
    toast.innerHTML = '<i class="fas fa-info-circle"></i> ' + msg;
    toast.classList.add('show');
    setTimeout(function() { toast.classList.remove('show'); }, 3000);
}

// Tabs
function initAdminTabs() {
    var navBtns = document.querySelectorAll('.admin-nav-btn');
    var tabs = document.querySelectorAll('.admin-tab');

    navBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            navBtns.forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            
            var tabId = btn.getAttribute('data-tab');
            
            tabs.forEach(function(t) { 
                t.classList.remove('active');
                t.style.display = 'none'; 
            });

            var targetTab = document.getElementById('tab-' + tabId);
            if (targetTab) {
                targetTab.classList.add('active');
                targetTab.style.display = 'block';
            }

            if (tabId === 'dashboard') renderDashboard();
            if (tabId === 'products') renderAdminProducts();
            if (tabId === 'customers') renderCustomers();
            if (tabId === 'os') renderOS();
            if (tabId === 'guarantees') renderGuarantees();
            if (tabId === 'quotes') renderQuotes();
            if (tabId === 'finance') renderFinance();
            if (tabId === 'reports') renderReports();
            if (tabId === 'partners') renderPartners();
            if (tabId === 'documents') renderDocuments();
            if (tabId === 'shipping') renderAdminShipping();
            if (tabId === 'orders') loadOrdersFromFirebase().then(renderAdminOrders);
            
            if (window.innerWidth <= 768) {
                document.body.classList.remove('sidebar-mobile-open');
                updateMobileMenuButton();
            }
        });
    });
}

// Dashboard
function renderDashboard() {
    var os = JSON.parse(localStorage.getItem('kaos_os') || '[]');
    var customers = JSON.parse(localStorage.getItem('kaos_customers') || '[]');
    var products = getProducts();
    
    var osAbertas = os.filter(function(o) { 
        return o.status === 'Aberto' || o.status === 'Em Análise' || o.status === 'Aguardando Peça'; 
    }).length;
    
    var estoqueBaixo = products.filter(function(p) { 
        return p.estoque <= (p.estoqueMin || 5); 
    }).length;
    
    var totalVendas = os.reduce(function(acc, o) { 
        if (o.status === 'Entregue' || o.status === 'Pronto') {
            return acc + (o.valorServico + o.valorPecas);
        }
        return acc;
    }, 0);
    
    var lucroEstimado = totalVendas * 0.3;
    
    var dashVendas = document.getElementById('dash-vendas-mes');
    var dashLucro = document.getElementById('dash-lucro-mes');
    var dashOsAbertas = document.getElementById('dash-os-abertas');
    var dashEstoqueBaixo = document.getElementById('dash-estoque-baixo');
    
    if (dashVendas) dashVendas.textContent = 'R$ ' + totalVendas.toFixed(2).replace('.', ',');
    if (dashLucro) dashLucro.textContent = 'R$ ' + lucroEstimado.toFixed(2).replace('.', ',');
    if (dashOsAbertas) dashOsAbertas.textContent = osAbertas;
    if (dashEstoqueBaixo) dashEstoqueBaixo.textContent = estoqueBaixo;

    var dashOsList = document.getElementById('dash-os-list');
    if (dashOsList) {
        dashOsList.innerHTML = '';
        var recentOS = os.slice(-5);
        recentOS.reverse();
        for (var i = 0; i < recentOS.length; i++) {
            var o = recentOS[i];
            var c = customers.find(function(cust) { return cust.id == o.customerId; });
            var tr = document.createElement('tr');
            var statusClass = (o.status || 'aberto').toLowerCase().replace(/ /g, '');
            tr.innerHTML = '<td>' + (c ? c.nome : 'Excluído') + '</td><td>' + o.equipamento + '<td><span class="status-badge status-' + statusClass + '">' + (o.status || 'Aberto') + '</span></td><td>R$ ' + (o.valorServico + o.valorPecas).toFixed(2).replace('.', ',') + '</td>';
            dashOsList.appendChild(tr);
        }
    }
}

// Clientes
function getCustomers() { 
    return JSON.parse(localStorage.getItem('kaos_customers') || '[]'); 
}

function saveCustomers(data) { 
    localStorage.setItem('kaos_customers', JSON.stringify(data)); 
    if (window.KOSData) window.KOSData.saveCollection('customers', data);
}

function renderCustomers(filter) {
    var customers = getCustomers();
    var list = document.getElementById('customers-list');
    if (!list) return;

    if (filter) {
        var f = filter.toLowerCase();
        customers = customers.filter(function(c) {
            return c.nome.toLowerCase().includes(f) || 
                   (c.doc && c.doc.includes(f)) ||
                   (c.tel && c.tel.includes(f));
        });
    }

    list.innerHTML = '';
    for (var i = 0; i < customers.length; i++) {
        var c = customers[i];
        var tr = document.createElement('tr');
        tr.innerHTML = '<td>' + c.nome + '</td><td>' + (c.doc || '-') + '<tr><td>' + (c.tel || '-') + '</td><td>' + (c.cidade || 'Petrópolis') + '</td><td><div class="table-actions"><button onclick="editCustomer(' + c.id + ')" class="btn-edit-row"><i class="fas fa-edit"></i></button><button onclick="deleteCustomer(' + c.id + ')" class="btn-delete-row"><i class="fas fa-trash"></i></button></div></td>';
        list.appendChild(tr);
    }
}

function initCustomerModal() {
    var modal = document.getElementById('customer-modal');
    var form = document.getElementById('customer-form');
    var btnAdd = document.getElementById('btn-add-customer');
    var btnClose = document.getElementById('close-customer-modal');
    var btnCancel = document.getElementById('cancel-customer-modal');
    var overlay = document.getElementById('overlay');
    
    if (!modal || !form) return;
    
    if (btnAdd) {
        btnAdd.onclick = function() {
            form.reset();
            document.getElementById('cust-id').value = '';
            document.getElementById('customer-modal-title').textContent = 'Novo Cliente';
            modal.style.display = 'flex';
            modal.classList.add('active');
            if (overlay) overlay.classList.add('active');
        };
    }
    
    function closeModal() {
        modal.classList.remove('active');
        modal.style.display = 'none';
        if (overlay) overlay.classList.remove('active');
    }
    
    if (btnClose) btnClose.onclick = closeModal;
    if (btnCancel) btnCancel.onclick = closeModal;
    if (overlay) overlay.onclick = closeModal;

    form.onsubmit = function(e) {
        e.preventDefault();
        var customers = getCustomers();
        var id = document.getElementById('cust-id').value;
        var data = {
            id: id ? parseInt(id) : Date.now(),
            nome: document.getElementById('cust-nome').value,
            doc: document.getElementById('cust-doc').value,
            tel: document.getElementById('cust-tel').value,
            end: document.getElementById('cust-end').value,
            cidade: document.getElementById('cust-cidade').value,
            bairro: document.getElementById('cust-bairro').value
        };

        if (id) {
            var idx = -1;
            for (var i = 0; i < customers.length; i++) {
                if (customers[i].id == id) {
                    idx = i;
                    break;
                }
            }
            if (idx !== -1) customers[idx] = data;
        } else {
            customers.push(data);
        }

        saveCustomers(customers);
        closeModal();
        renderCustomers();
        showAdminToast('Cliente salvo!');
    };
}

window.editCustomer = function(id) {
    var customers = getCustomers();
    var c = null;
    for (var i = 0; i < customers.length; i++) {
        if (customers[i].id == id) {
            c = customers[i];
            break;
        }
    }
    if (!c) return;
    document.getElementById('cust-id').value = c.id;
    document.getElementById('cust-nome').value = c.nome;
    document.getElementById('cust-doc').value = c.doc || '';
    document.getElementById('cust-tel').value = c.tel || '';
    document.getElementById('cust-end').value = c.end || '';
    document.getElementById('cust-cidade').value = c.cidade || 'Petrópolis';
    document.getElementById('cust-bairro').value = c.bairro || '';
    document.getElementById('customer-modal-title').textContent = 'Editar Cliente';
    var modal = document.getElementById('customer-modal');
    modal.style.display = 'flex';
    modal.classList.add('active');
    document.getElementById('overlay').classList.add('active');
};

window.deleteCustomer = function(id) {
    if (confirm('Excluir este cliente?')) {
        var customers = getCustomers();
        var newCustomers = [];
        for (var i = 0; i < customers.length; i++) {
            if (customers[i].id != id) {
                newCustomers.push(customers[i]);
            }
        }
        saveCustomers(newCustomers);
        renderCustomers();
        showAdminToast('Cliente excluído!');
    }
};

// Ordens de Servico
function getOS() { 
    return JSON.parse(localStorage.getItem('kaos_os') || '[]'); 
}

function saveOS(data) { 
    localStorage.setItem('kaos_os', JSON.stringify(data)); 
    if (window.KOSData) window.KOSData.saveCollection('os', data);
}

function renderOS() {
    var os = getOS();
    var customers = getCustomers();
    var list = document.getElementById('os-list');
    if (!list) return;

    list.innerHTML = '';
    for (var i = os.length - 1; i >= 0; i--) {
        var o = os[i];
        var c = customers.find(function(customer) { return customer.id == (o.customerId || o.clienteId); });
        var statusClass = (o.status || 'aberto').toLowerCase().replace(/ /g, '');
        var total = (parseFloat(o.valorServico || o.valorMaoObra) || 0) + (parseFloat(o.valorPecas) || 0);
        var osActions = '<button onclick="printOSAsPDF(' + o.id + ')" class="btn-edit-row" style="color:#25d366;" title="Baixar PDF"><i class="fas fa-file-pdf"></i></button>' +
            '<button onclick="createDocumentFromOS(' + o.id + ', \'RECIBO\')" class="btn-edit-row" title="Recibo"><i class="fas fa-receipt"></i></button>' +
            '<button onclick="createDocumentFromOS(' + o.id + ', \'COMPROVANTE\')" class="btn-edit-row" title="Comprovante"><i class="fas fa-file-signature"></i></button>' +
            '<button onclick="createGuaranteeFromOS(' + o.id + ')" class="btn-edit-row" title="Garantia"><i class="fas fa-shield-alt"></i></button>' +
            '<button onclick="requestOfficialNoteFromOS(' + o.id + ')" class="btn-edit-row" title="Nota oficial"><i class="fas fa-file-invoice"></i></button>' +
            '<button onclick="editOS(' + o.id + ')" class="btn-edit-row"><i class="fas fa-edit"></i></button>' +
            '<button onclick="deleteOS(' + o.id + ')" class="btn-delete-row"><i class="fas fa-trash"></i></button>';
        var tr = document.createElement('tr');
        tr.innerHTML = '<td>#' + o.id.toString().slice(-4) + '</td><td>' + (c ? c.nome : (o.clienteNome || 'Excluído')) + '</td><td>' + (o.equipamento || '-') + '</td><td>' + (o.data ? o.data.split('-').reverse().join('/') : '-') + '</td><td><span class="status-badge status-' + statusClass + '">' + (o.status || 'Aberto') + '</span></td><td>R$ ' + total.toFixed(2).replace('.', ',') + '</td><td><div class="table-actions">' + osActions + '</div></td>';
        list.appendChild(tr);
    }
}
function populateOSCustomers(selectedId) {
    var select = document.getElementById('os-cust-id');
    if (!select) return;
    var customers = getCustomers();
    select.innerHTML = '<option value="">Selecione um cliente</option>';
    for (var i = 0; i < customers.length; i++) {
        var c = customers[i];
        var opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.nome;
        if (c.id == selectedId) opt.selected = true;
        select.appendChild(opt);
    }
}

function initOSModal() {
    var modal = document.getElementById('os-modal');
    var form = document.getElementById('os-form');
    var btnAdd = document.getElementById('btn-add-os');
    var btnClose = document.getElementById('close-os-modal');
    var btnCancel = document.getElementById('cancel-os-modal');
    var overlay = document.getElementById('overlay');
    
    if (!modal || !form) return;
    
    if (btnAdd) {
        btnAdd.onclick = function() {
            form.reset();
            document.getElementById('os-id').value = '';
            document.getElementById('os-data').valueAsDate = new Date();
            document.getElementById('os-garantia').value = 90;
            populateOSCustomers();
            modal.style.display = 'flex';
            modal.classList.add('active');
            if (overlay) overlay.classList.add('active');
        };
    }
    
    function closeModal() {
        modal.classList.remove('active');
        modal.style.display = 'none';
        if (overlay) overlay.classList.remove('active');
    }
    
    if (btnClose) btnClose.onclick = closeModal;
    if (btnCancel) btnCancel.onclick = closeModal;

    form.onsubmit = function(e) {
        e.preventDefault();
        var os = getOS();
        var id = document.getElementById('os-id').value;
        var customerId = document.getElementById('os-cust-id').value;
        
        if (!customerId) {
            showAdminToast('Selecione um cliente!', 'error');
            return;
        }
        
        var data = {
            id: id ? parseInt(id) : Date.now(),
            customerId: parseInt(customerId),
            data: document.getElementById('os-data').value || new Date().toISOString().split('T')[0],
            equipamento: document.getElementById('os-equip').value,
            status: document.getElementById('os-status').value,
            defeito: document.getElementById('os-defeito').value,
            laudo: document.getElementById('os-laudo').value,
            valorServico: parseFloat(document.getElementById('os-valor-serv').value) || 0,
            valorPecas: parseFloat(document.getElementById('os-valor-pecas').value) || 0,
            garantia: parseInt(document.getElementById('os-garantia').value) || 90,
            pagamento: document.getElementById('os-pagamento').value || 'Não informado'
        };

        if (id) {
            var idx = -1;
            for (var i = 0; i < os.length; i++) {
                if (os[i].id == id) {
                    idx = i;
                    break;
                }
            }
            if (idx !== -1) os[idx] = data;
        } else {
            os.push(data);
        }

        saveOS(os);
        closeModal();
        renderOS();
        renderDashboard();
        showAdminToast('OS salva!');
    };
}

window.editOS = function(id) {
    var os = getOS();
    var o = null;
    for (var i = 0; i < os.length; i++) {
        if (os[i].id == id) {
            o = os[i];
            break;
        }
    }
    if (!o) return;
    populateOSCustomers(o.customerId);
    document.getElementById('os-id').value = o.id;
    document.getElementById('os-data').value = o.data;
    document.getElementById('os-equip').value = o.equipamento;
    document.getElementById('os-status').value = o.status;
    document.getElementById('os-defeito').value = o.defeito || '';
    document.getElementById('os-laudo').value = o.laudo || '';
    document.getElementById('os-valor-serv').value = o.valorServico;
    document.getElementById('os-valor-pecas').value = o.valorPecas;
    document.getElementById('os-garantia').value = o.garantia || 90;
    document.getElementById('os-pagamento').value = o.pagamento || '';
    var modal = document.getElementById('os-modal');
    modal.style.display = 'flex';
    modal.classList.add('active');
    document.getElementById('overlay').classList.add('active');
};

window.deleteOS = function(id) {
    if (confirm('Excluir esta OS?')) {
        var os = getOS();
        var newOS = [];
        for (var i = 0; i < os.length; i++) {
            if (os[i].id != id) {
                newOS.push(os[i]);
            }
        }
        saveOS(newOS);
        renderOS();
        showAdminToast('OS excluída!');
    }
};

// Impressao como PDF
function generateOSHTML(o, c) {
    var total = (o.valorServico + o.valorPecas).toFixed(2).replace('.', ',');
    var dataEntrada = o.data ? o.data.split('-').reverse().join('/') : '-';
    
    return '<!DOCTYPE html>\n' +
        '<html>\n' +
        '<head>\n' +
        '    <meta charset="UTF-8">\n' +
        '    <title>OS_' + o.id + '_KB_Tech</title>\n' +
        '    <style>\n' +
        '        * { margin: 0; padding: 0; box-sizing: border-box; }\n' +
        '        body { font-family: Arial, sans-serif; background: white; padding: 20px; }\n' +
        '        .document { max-width: 800px; margin: 0 auto; background: white; }\n' +
        '        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px; }\n' +
        '        .company h2 { margin: 0; color: #0066ff; }\n' +
        '        .company p { margin: 2px 0; font-size: 12px; color: #555; }\n' +
        '        .title { text-align: right; }\n' +
        '        .title h1 { margin: 0; font-size: 20px; }\n' +
        '        .title p { margin: 5px 0; }\n' +
        '        .section { border: 1px solid #ddd; padding: 12px; border-radius: 4px; margin-bottom: 15px; }\n' +
        '        .section h4 { margin: 0 0 8px 0; color: #0066ff; font-size: 12px; }\n' +
        '        .section p { margin: 3px 0; font-size: 13px; }\n' +
        '        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; }\n' +
        '        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }\n' +
        '        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }\n' +
        '        th { background: #f5f5f5; }\n' +
        '        .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 10px; }\n' +
        '        .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 50px; margin-top: 50px; text-align: center; }\n' +
        '        .signature { border-top: 1px solid #000; padding-top: 8px; width: 200px; margin: 0 auto; font-size: 12px; }\n' +
        '    </style>\n' +
        '</head>\n' +
        '<body>\n' +
        '    <div class="document">\n' +
        '        <div class="header">\n' +
        '            <div class="company">\n' +
        '                <h2>KB Tech</h2>\n' +
        '                <p>CNPJ: 55.452.123/0001-89</p>\n' +
        '                <p>Petrópolis, RJ</p>\n' +
        '                <p>WhatsApp: (24) 99204-6467</p>\n' +
        '            </div>\n' +
        '            <div class="title">\n' +
        '                <h1>ORDEM DE SERVICO</h1>\n' +
        '                <p><strong>Nº:</strong> ' + o.id.toString().slice(-6) + '</p>\n' +
        '                <p><strong>Data:</strong> ' + dataEntrada + '</p>\n' +
        '            </div>\n' +
        '        </div>\n' +
        '        <div class="grid">\n' +
        '            <div class="section">\n' +
        '                <h4>DADOS DO CLIENTE</h4>\n' +
        '                <p><strong>Nome:</strong> ' + (c ? c.nome : 'N/A') + '</p>\n' +
        '                <p><strong>CPF/CNPJ:</strong> ' + (c && c.doc ? c.doc : '-') + '</p>\n' +
        '                <p><strong>Telefone:</strong> ' + (c ? c.tel : '-') + '</p>\n' +
        '            </div>\n' +
        '            <div class="section">\n' +
        '                <h4>DADOS DO EQUIPAMENTO</h4>\n' +
        '                <p><strong>Equipamento:</strong> ' + o.equipamento + '</p>\n' +
        '                <p><strong>Status:</strong> ' + o.status + '</p>\n' +
        '                <p><strong>Garantia:</strong> ' + (o.garantia || 90) + ' dias</p>\n' +
        '            </div>\n' +
        '        </div>\n' +
        '        <div class="section">\n' +
        '            <h4>DEFEITO / RECLAMACAO</h4>\n' +
        '            <p>' + (o.defeito || 'Nenhum defeito informado.') + '</p>\n' +
        '        </div>\n' +
        '        <div class="section">\n' +
        '            <h4>LAUDO TECNICO / SERVICO REALIZADO</h4>\n' +
        '            <p>' + (o.laudo || 'Aguardando análise.') + '</p>\n' +
        '        </div>\n' +
        '        <table>\n' +
        '            <thead><tr><th>Descrição</th><th style="text-align:right">Valor (R$)</th></tr></thead>\n' +
        '            <tbody>\n' +
        '                <tr><td>Mão de Obra / Serviço</td><td style="text-align:right">R$ ' + o.valorServico.toFixed(2).replace('.', ',') + '</td></tr>\n' +
        '                <tr><td>Peças / Componentes</td><td style="text-align:right">R$ ' + o.valorPecas.toFixed(2).replace('.', ',') + '</td></tr>\n' +
        '            </tbody>\n' +
        '            <tfoot><tr style="background:#f9f9f9; font-weight:bold;"><td>TOTAL</td><td style="text-align:right">R$ ' + total + '</td></tr></tfoot>\n' +
        '        </table>\n' +
        '        <div class="section">\n' +
        '            <h4>INFORMACOES ADICIONAIS</h4>\n' +
        '            <p><strong>Forma de Pagamento:</strong> ' + (o.pagamento || 'A definir') + '</p>\n' +
        '        </div>\n' +
        '        <div class="signatures">\n' +
        '            <div><div class="signature">KB Tech</div></div>\n' +
        '            <div><div class="signature">ASSINATURA DO CLIENTE</div></div>\n' +
        '        </div>\n' +
        '    </div>\n' +
        '</body>\n' +
        '</html>';
}

window.printOSAsPDF = function(id) {
    console.log('Gerando PDF para OS ID:', id);
    
    var os = getOS();
    var o = null;
    for (var i = 0; i < os.length; i++) {
        if (os[i].id == id) {
            o = os[i];
            break;
        }
    }
    
    if (!o) {
        showAdminToast('OS não encontrada!', 'error');
        return;
    }
    
    var customers = getCustomers();
    var c = null;
    for (var i = 0; i < customers.length; i++) {
        if (customers[i].id == o.customerId) {
            c = customers[i];
            break;
        }
    }
    
    var htmlContent = generateOSHTML(o, c);
    var blob = new Blob([htmlContent], { type: 'text/html' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'OS_' + o.id + '_KB_Tech.html';
    a.click();
    URL.revokeObjectURL(url);
    showAdminToast('OS exportada! Abra o arquivo e imprima como PDF.');
};

function findOSById(id) {
    return getOS().find(function(o) { return String(o.id) === String(id); });
}

function getCustomerById(id) {
    return getCustomers().find(function(c) { return String(c.id) === String(id); });
}

window.createDocumentFromOS = function(id, type) {
    var os = findOSById(id);
    if (!os) return;
    var c = getCustomerById(os.customerId || os.clienteId) || {};
    createInternalDocumentPrompt(type, {
        clienteId: c.id || '',
        clienteNome: c.nome || os.clienteNome || '',
        clienteDocumento: c.doc || '',
        clienteTelefone: c.tel || '',
        descricao: os.equipamento + ' - ' + (os.laudo || os.defeito || ''),
        valor: (parseFloat(os.valorServico || os.valorMaoObra) || 0) + (parseFloat(os.valorPecas) || 0),
        formaPagamento: os.pagamento || os.formaPagamento || '',
        referenciaId: os.id,
        referenciaTipo: 'OS',
        origem: 'Ordem de Servico'
    });
};

window.createGuaranteeFromOS = function(id) {
    var os = findOSById(id);
    if (!os) return;
    var c = getCustomerById(os.customerId || os.clienteId) || {};
    var docs = getDocuments();
    var doc = normalizeDocument({
        id: Date.now(),
        tipoDocumento: 'GARANTIA',
        numeroDocumento: 'GAR-' + Date.now().toString().slice(-6),
        clienteId: c.id || '',
        clienteNome: c.nome || os.clienteNome || '',
        clienteDocumento: c.doc || '',
        clienteTelefone: c.tel || '',
        descricao: os.equipamento + ' - garantia de ' + (os.garantia || os.garantiaDias || 90) + ' dias',
        valor: 0,
        dataEmissao: new Date().toISOString().slice(0, 10),
        origem: 'Ordem de Servico',
        referenciaId: os.id,
        referenciaTipo: 'OS',
        status: 'Gerado',
        observacoes: INTERNAL_DOC_NOTICE
    });
    docs.push(doc);
    saveDocuments(docs);
    renderDocuments();
    printFiscalDocument(doc);
};

window.requestOfficialNoteFromOS = function(id) {
    var os = findOSById(id);
    if (!os) return;
    var c = getCustomerById(os.customerId || os.clienteId) || {};
    requestOfficialNotePrompt({
        clienteNome: c.nome || os.clienteNome || '',
        clienteDocumento: c.doc || '',
        clienteTelefone: c.tel || '',
        descricao: os.equipamento + ' - ' + (os.laudo || os.defeito || ''),
        valor: (parseFloat(os.valorServico || os.valorMaoObra) || 0) + (parseFloat(os.valorPecas) || 0),
        status: 'Solicitada'
    });
};

// Produtos
function renderAdminProducts(filter) {
    var products = getProducts();
    var tbody = document.getElementById('products-tbody');
    if (!tbody) return;

    if (filter) {
        var f = filter.toLowerCase();
        var filtered = [];
        for (var i = 0; i < products.length; i++) {
            var p = products[i];
            if (p.nome.toLowerCase().includes(f) || p.categoria.toLowerCase().includes(f) || (p.fornecedor || '').toLowerCase().includes(f)) {
                filtered.push(p);
            }
        }
        products = filtered;
    }

    var statTotal = document.getElementById('stat-total');
    var statDestaque = document.getElementById('stat-destaque');
    var statOferta = document.getElementById('stat-oferta');
    var statZerado = document.getElementById('stat-zerado');
    
    if (statTotal) statTotal.textContent = products.length;
    
    var destaqueCount = 0, ofertaCount = 0, zeradoCount = 0;
    for (var i = 0; i < products.length; i++) {
        if (products[i].ativo !== false && products[i].destaque) destaqueCount++;
        if (products[i].ativo !== false && products[i].oferta) ofertaCount++;
        if (products[i].ativo !== false && products[i].estoque <= 0) zeradoCount++;
    }
    if (statDestaque) statDestaque.textContent = destaqueCount;
    if (statOferta) statOferta.textContent = ofertaCount;
    if (statZerado) statZerado.textContent = zeradoCount;

    tbody.innerHTML = '';
    for (var i = 0; i < products.length; i++) {
        var p = products[i];
        var flags = '';
        if (p.ativo === false) flags += '<span class="flag-badge">Inativo</span>';
        if (p.destaque) flags += '<span class="flag-badge flag-destaque">Destaque</span>';
        if (p.oferta) flags += '<span class="flag-badge flag-oferta">Oferta</span>';
        if (p.maisVendido) flags += '<span class="flag-badge flag-mais-vendido">+Vendido</span>';

        var stockClass = '';
        if (p.estoque <= 0) stockClass = 'stock-zero';
        else if (p.estoque <= (p.estoqueMinimo || p.estoqueMin || 5)) stockClass = 'stock-low';
        
        var precoVenda = parseFloat(p.precoVenda !== undefined ? p.precoVenda : p.preco) || 0;
        var precoCusto = parseFloat(p.precoCusto !== undefined ? p.precoCusto : p.custo) || 0;
        var lucro = precoVenda - precoCusto;
        var margem = precoVenda > 0 ? ((lucro / precoVenda) * 100).toFixed(1) : 0;
        var lucroClass = lucro < 0 ? 'lucro-negativo' : '';
        var stockLabel = p.estoque <= 0 ? p.estoque + ' - zerado' : (p.estoque <= (p.estoqueMinimo || p.estoqueMin || 5) ? p.estoque + ' - baixo' : p.estoque);
        var toggleIcon = p.ativo === false ? 'fa-toggle-on' : 'fa-toggle-off';
        var toggleTitle = p.ativo === false ? 'Reativar produto' : 'Inativar produto';

        var tr = document.createElement('tr');
        tr.innerHTML = '<td>#' + p.id.toString().slice(-4) + '</td><td><img src="' + (p.imagem || 'https://placehold.co/100') + '" width="40" onerror="this.src=\'https://placehold.co/100\'"></td><td><strong>' + p.nome.substring(0, 30) + (p.nome.length > 30 ? '...' : '') + '</strong><br><small>' + (p.fornecedor || '-') + '</small></td><td>' + p.categoria + '</td><td>R$ ' + precoCusto.toFixed(2).replace('.', ',') + '</td><td>R$ ' + precoVenda.toFixed(2).replace('.', ',') + '</td><td class="' + lucroClass + '">R$ ' + lucro.toFixed(2).replace('.', ',') + '</td><td>' + margem + '%</td><td class="' + stockClass + '">' + stockLabel + '</td><td>' + flags + '</td><td><div class="table-actions"><button onclick="editProduct(' + p.id + ')" class="btn-edit-row" title="Editar"><i class="fas fa-edit"></i></button><button onclick="toggleProductActive(' + p.id + ')" class="btn-edit-row" title="' + toggleTitle + '"><i class="fas ' + toggleIcon + '"></i></button><button onclick="deleteProduct(' + p.id + ')" class="btn-delete-row" title="Excluir"><i class="fas fa-trash"></i></button></div></td>';
        tbody.appendChild(tr);
    }
}

function initProductModal() {
    var modal = document.getElementById('product-modal');
    var form = document.getElementById('product-form');
    var btnAdd = document.getElementById('btn-add-product');
    var btnClose = document.getElementById('close-product-modal');
    var btnCancel = document.getElementById('cancel-product-modal');
    var overlay = document.getElementById('overlay');
    
    if (!modal || !form) return;
    
    if (btnAdd) {
        btnAdd.onclick = function() {
            form.reset();
            document.getElementById('prod-id').value = '';
            document.getElementById('product-modal-title').textContent = 'Novo Produto';
            modal.style.display = 'flex';
            modal.classList.add('active');
            if (overlay) overlay.classList.add('active');
        };
    }
    
    function closeModal() {
        modal.classList.remove('active');
        modal.style.display = 'none';
        if (overlay) overlay.classList.remove('active');
    }
    
    if (btnClose) btnClose.onclick = closeModal;
    if (btnCancel) btnCancel.onclick = closeModal;
    
    form.onsubmit = function(e) {
        e.preventDefault();
        var products = getProducts();
        var id = document.getElementById('prod-id').value;
        var existing = null;
        if (id) {
            for (var eidx = 0; eidx < products.length; eidx++) {
                if (products[eidx].id == id) existing = products[eidx];
            }
        }
        var precoVenda = parseFloat(document.getElementById('prod-preco').value) || 0;
        var precoCusto = parseFloat(document.getElementById('prod-custo').value) || 0;
        var estoqueMinimo = parseInt(document.getElementById('prod-estoque-min').value) || 5;
        var now = new Date().toISOString();
        var data = {
            id: id ? parseInt(id) : Date.now(),
            nome: document.getElementById('prod-nome').value,
            descricao: document.getElementById('prod-descricao') ? document.getElementById('prod-descricao').value : '',
            preco: precoVenda,
            precoVenda: precoVenda,
            custo: precoCusto,
            precoCusto: precoCusto,
            estoque: parseInt(document.getElementById('prod-estoque').value) || 0,
            estoqueMin: estoqueMinimo,
            estoqueMinimo: estoqueMinimo,
            fornecedor: document.getElementById('prod-fornecedor').value || '',
            categoria: document.getElementById('prod-categoria').value,
            imagem: document.getElementById('prod-imagem').value || 'https://placehold.co/400',
            ativo: document.getElementById('prod-ativo') ? document.getElementById('prod-ativo').checked : true,
            destaque: document.getElementById('prod-destaque').checked,
            oferta: document.getElementById('prod-oferta').checked,
            maisVendido: document.getElementById('prod-mais-vendido').checked,
            desconto: parseInt(document.getElementById('prod-desconto').value) || 0,
            criadoEm: existing && existing.criadoEm ? existing.criadoEm : now,
            atualizadoEm: now
        };
        
        if (id) {
            var idx = -1;
            for (var i = 0; i < products.length; i++) {
                if (products[i].id == id) {
                    idx = i;
                    break;
                }
            }
            if (idx !== -1) products[idx] = data;
        } else {
            products.push(data);
        }
        
        saveProducts(products);
        closeModal();
        renderAdminProducts();
        showAdminToast('Produto salvo!');
    };
}

window.editProduct = function(id) {
    var products = getProducts();
    var p = null;
    for (var i = 0; i < products.length; i++) {
        if (products[i].id == id) {
            p = products[i];
            break;
        }
    }
    if (!p) return;
    document.getElementById('prod-id').value = p.id;
    document.getElementById('prod-nome').value = p.nome;
    document.getElementById('prod-preco').value = p.precoVenda !== undefined ? p.precoVenda : p.preco;
    document.getElementById('prod-custo').value = p.precoCusto !== undefined ? p.precoCusto : (p.custo || 0);
    document.getElementById('prod-estoque').value = p.estoque;
    document.getElementById('prod-estoque-min').value = p.estoqueMinimo || p.estoqueMin || 5;
    document.getElementById('prod-fornecedor').value = p.fornecedor || '';
    document.getElementById('prod-categoria').value = p.categoria;
    document.getElementById('prod-imagem').value = p.imagem || '';
    if (document.getElementById('prod-descricao')) document.getElementById('prod-descricao').value = p.descricao || '';
    if (document.getElementById('prod-ativo')) document.getElementById('prod-ativo').checked = p.ativo !== false;
    document.getElementById('prod-destaque').checked = p.destaque || false;
    document.getElementById('prod-oferta').checked = p.oferta || false;
    document.getElementById('prod-mais-vendido').checked = p.maisVendido || false;
    document.getElementById('prod-desconto').value = p.desconto || 0;
    document.getElementById('product-modal-title').textContent = 'Editar Produto';
    var modal = document.getElementById('product-modal');
    modal.style.display = 'flex';
    modal.classList.add('active');
    document.getElementById('overlay').classList.add('active');
};

window.toggleProductActive = function(id) {
    var products = getProducts();
    for (var i = 0; i < products.length; i++) {
        if (products[i].id == id) {
            products[i].ativo = products[i].ativo === false;
            products[i].atualizadoEm = new Date().toISOString();
            break;
        }
    }
    saveProducts(products);
    renderAdminProducts();
    showAdminToast('Status do produto atualizado!');
};

window.deleteProduct = function(id) {
    if (confirm('Excluir este produto?')) {
        var products = getProducts();
        var newProducts = [];
        for (var i = 0; i < products.length; i++) {
            if (products[i].id != id) {
                newProducts.push(products[i]);
            }
        }
        saveProducts(newProducts);
        renderAdminProducts();
        showAdminToast('Produto excluído!');
    }
};

// Frete
function renderAdminShipping() {
    var shipping = getShipping();
    var tbody = document.getElementById('shipping-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    for (var i = 0; i < shipping.length; i++) {
        var s = shipping[i];
        var tr = document.createElement('tr');
        tr.innerHTML = '<td>' + s.nome + '</td><td>R$ ' + s.valor.toFixed(2).replace('.', ',') + '</td><td><div class="table-actions"><button onclick="editBairro(\'' + s.nome.replace(/'/g, "\\'") + '\')" class="btn-edit-row"><i class="fas fa-edit"></i></button><button onclick="deleteBairro(\'' + s.nome.replace(/'/g, "\\'") + '\')" class="btn-delete-row"><i class="fas fa-trash"></i></button></div></td>';
        tbody.appendChild(tr);
    }
}

function initShippingModal() {
    var modal = document.getElementById('bairro-modal');
    var form = document.getElementById('bairro-form');
    var btnAdd = document.getElementById('btn-add-bairro');
    var btnClose = document.getElementById('close-bairro-modal');
    var btnCancel = document.getElementById('cancel-bairro-modal');
    var overlay = document.getElementById('overlay');
    
    if (!modal || !form) return;
    
    if (btnAdd) {
        btnAdd.onclick = function() {
            form.reset();
            document.getElementById('bairro-original').value = '';
            document.getElementById('bairro-modal-title').textContent = 'Novo Bairro';
            modal.style.display = 'flex';
            modal.classList.add('active');
            if (overlay) overlay.classList.add('active');
        };
    }
    
    function closeModal() {
        modal.classList.remove('active');
        modal.style.display = 'none';
        if (overlay) overlay.classList.remove('active');
    }
    
    if (btnClose) btnClose.onclick = closeModal;
    if (btnCancel) btnCancel.onclick = closeModal;
    
    form.onsubmit = function(e) {
        e.preventDefault();
        var shipping = getShipping();
        var original = document.getElementById('bairro-original').value;
        var data = { 
            nome: document.getElementById('bairro-nome').value, 
            valor: parseFloat(document.getElementById('bairro-valor').value) || 0 
        };
        if (original) {
            var idx = -1;
            for (var i = 0; i < shipping.length; i++) {
                if (shipping[i].nome == original) {
                    idx = i;
                    break;
                }
            }
            if (idx !== -1) shipping[idx] = data;
        } else {
            shipping.push(data);
        }
        saveShipping(shipping);
        closeModal();
        renderAdminShipping();
        showAdminToast('Bairro salvo!');
    };
}

window.editBairro = function(nome) {
    var shipping = getShipping();
    var s = null;
    for (var i = 0; i < shipping.length; i++) {
        if (shipping[i].nome == nome) {
            s = shipping[i];
            break;
        }
    }
    if (!s) return;
    document.getElementById('bairro-original').value = s.nome;
    document.getElementById('bairro-nome').value = s.nome;
    document.getElementById('bairro-valor').value = s.valor;
    document.getElementById('bairro-modal-title').textContent = 'Editar Bairro';
    var modal = document.getElementById('bairro-modal');
    modal.style.display = 'flex';
    modal.classList.add('active');
    document.getElementById('overlay').classList.add('active');
};

window.deleteBairro = function(nome) {
    if (confirm('Excluir este bairro?')) {
        var shipping = getShipping();
        var newShipping = [];
        for (var i = 0; i < shipping.length; i++) {
            if (shipping[i].nome != nome) {
                newShipping.push(shipping[i]);
            }
        }
        saveShipping(newShipping);
        renderAdminShipping();
        showAdminToast('Bairro excluído!');
    }
};

var ORDER_STATUS_OPTIONS = ['Novo', 'Em atendimento', 'Aguardando pagamento', 'Pago', 'Separado', 'Entregue', 'Cancelado'];

function normalizeOrder(order, index) {
    order = order || {};
    var items = order.itens || order.items || order.cart || [];
    return Object.assign({}, order, {
        id: order.id || order.numeroPedido || order.docId || (order.data || order.dataPedido || Date.now()) + '-' + index,
        clienteNome: order.clienteNome || order.nome || (order.cliente && order.cliente.nome) || 'Cliente',
        telefone: order.telefone || (order.cliente && order.cliente.telefone) || '',
        itens: items,
        subtotal: parseFloat(order.subtotal) || 0,
        frete: parseFloat(order.frete) || 0,
        total: parseFloat(order.total) || 0,
        status: order.status || 'Novo',
        dataPedido: order.dataPedido || order.data || order.date || new Date().toISOString(),
        origem: order.origem || 'Site',
        estoqueBaixado: !!order.estoqueBaixado,
        receitaGerada: !!order.receitaGerada
    });
}

function getOrders() {
    return (JSON.parse(localStorage.getItem('katech_orders') || '[]') || []).map(normalizeOrder);
}

function saveOrders(orders) {
    var normalized = (orders || []).map(normalizeOrder);
    localStorage.setItem('katech_orders', JSON.stringify(normalized));
    if (window.KOSData) window.KOSData.saveCollection('orders', normalized);
}

async function loadOrdersFromFirebase() {
    if (!window.KOSData || !window.KOSData.isOnline()) return getOrders();
    try {
        var orders = await window.KOSData.fetchCollection('orders');
        saveOrders(orders);
        return getOrders();
    } catch (err) {
        console.warn('Falha ao carregar pedidos do Firebase.', err);
        return getOrders();
    }
}

function renderAdminOrders() {
    var orders = getOrders();
    var container = document.getElementById('orders-list');
    if (!container) return;
    container.innerHTML = '';
    if (orders.length === 0) {
        container.innerHTML = '<p class="empty-state"><i class="fas fa-inbox"></i> Nenhum pedido registrado.</p>';
        return;
    }
    orders.sort(function(a, b) { return new Date(b.dataPedido) - new Date(a.dataPedido); });
    for (var i = 0; i < orders.length; i++) {
        var o = orders[i];
        var itemsText = (o.itens || []).map(function(item) {
            return (item.nome || item.name || 'Produto') + ' x ' + (item.qty || item.quantidade || 1);
        }).join('<br>');
        var statusOptions = ORDER_STATUS_OPTIONS.map(function(status) {
            return '<option value="' + status + '"' + (o.status === status ? ' selected' : '') + '>' + status + '</option>';
        }).join('');
        var div = document.createElement('div');
        div.className = 'order-card';
        div.innerHTML =
            '<div class="order-card-header"><strong>' + o.clienteNome + '</strong><span class="order-date">' + new Date(o.dataPedido).toLocaleString('pt-BR') + '</span></div>' +
            '<div class="order-items">' + (itemsText || 'Sem itens') + '</div>' +
            '<div class="order-meta">Telefone: ' + (o.telefone || '-') + ' | Origem: ' + o.origem + '</div>' +
            '<div class="order-meta">Subtotal: ' + formatBRL(o.subtotal) + ' | Frete: ' + formatBRL(o.frete) + '</div>' +
            '<div class="order-total">Total: ' + formatBRL(o.total) + '</div>' +
            '<div class="order-actions">' +
            '<select onchange="updateOrderStatus(\'' + o.id + '\', this.value)">' + statusOptions + '</select>' +
            '<button class="btn-edit-row" onclick="openOrderWhatsApp(\'' + o.id + '\')" title="WhatsApp"><i class="fab fa-whatsapp"></i></button>' +
            '<button class="btn-edit-row" onclick="printOrder(\'' + o.id + '\')" title="Imprimir"><i class="fas fa-print"></i></button>' +
            '<button class="btn-edit-row" onclick="createDocumentFromOrder(\'' + o.id + '\', \'COMPROVANTE\')" title="Comprovante"><i class="fas fa-file-signature"></i></button>' +
            '<button class="btn-edit-row" onclick="requestOfficialNoteFromOrder(\'' + o.id + '\')" title="Cliente pediu nota"><i class="fas fa-file-invoice"></i></button>' +
            '<button class="btn-edit-row" onclick="registerOfficialNoteFromOrder(\'' + o.id + '\')" title="Registrar nota"><i class="fas fa-file-circle-check"></i></button>' +
            '<button class="btn-edit-row" onclick="finishOrder(\'' + o.id + '\')" title="Finalizar"><i class="fas fa-check"></i></button>' +
            '<button class="btn-delete-row" onclick="cancelOrder(\'' + o.id + '\')" title="Cancelar"><i class="fas fa-ban"></i></button>' +
            '<button class="btn-edit-row" onclick="createRevenueFromOrder(\'' + o.id + '\')" title="Virar receita"><i class="fas fa-wallet"></i></button>' +
            ((o.status === 'Pago' || o.status === 'Entregue') && !o.estoqueBaixado ? '<button class="btn-edit-row" onclick="manualStockOutOrder(\'' + o.id + '\')" title="Baixar estoque"><i class="fas fa-box-open"></i></button>' : '') +
            '</div>';
        container.appendChild(div);
    }
}

// Garantias
function findOrder(orderId) {
    return getOrders().find(function(order) { return String(order.id) === String(orderId); });
}

function updateOrder(orderId, updater) {
    var orders = getOrders();
    for (var i = 0; i < orders.length; i++) {
        if (String(orders[i].id) === String(orderId)) {
            updater(orders[i]);
            orders[i].atualizadoEm = new Date().toISOString();
            break;
        }
    }
    saveOrders(orders);
    renderAdminOrders();
}

window.updateOrderStatus = function(orderId, status) {
    updateOrder(orderId, function(order) { order.status = status; });
    showAdminToast('Status do pedido atualizado!');
};

window.openOrderWhatsApp = function(orderId) {
    var order = findOrder(orderId);
    if (!order || !order.telefone) {
        showAdminToast('Telefone do cliente nao encontrado.', 'error');
        return;
    }
    var phone = String(order.telefone).replace(/\D/g, '');
    if (!phone.startsWith('55')) phone = '55' + phone;
    var msg = 'Ola, ' + order.clienteNome + '! Estamos falando sobre seu pedido KB Tech no valor de ' + formatBRL(order.total) + '.';
    window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(msg), '_blank');
};

window.printOrder = function(orderId) {
    var order = findOrder(orderId);
    if (!order) return;
    var items = (order.itens || []).map(function(item) {
        return '<tr><td>' + (item.nome || 'Produto') + '</td><td>' + (item.qty || item.quantidade || 1) + '</td><td>' + formatBRL(item.preco || item.valor || 0) + '</td></tr>';
    }).join('');
    var win = window.open('', '_blank');
    win.document.write('<html><head><title>Pedido KB Tech</title><style>body{font-family:Arial;padding:24px}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ddd;padding:8px;text-align:left}</style></head><body><h2>Pedido KB Tech</h2><p><strong>Cliente:</strong> ' + order.clienteNome + '</p><p><strong>Telefone:</strong> ' + order.telefone + '</p><p><strong>Status:</strong> ' + order.status + '</p><table><thead><tr><th>Item</th><th>Qtd</th><th>Valor</th></tr></thead><tbody>' + items + '</tbody></table><h3>Total: ' + formatBRL(order.total) + '</h3></body></html>');
    win.document.close();
    win.print();
};

window.finishOrder = function(orderId) {
    updateOrder(orderId, function(order) { order.status = 'Entregue'; });
};

window.cancelOrder = function(orderId) {
    if (!confirm('Cancelar este pedido?')) return;
    updateOrder(orderId, function(order) { order.status = 'Cancelado'; });
};

window.createRevenueFromOrder = function(orderId) {
    var order = findOrder(orderId);
    if (!order) return;
    if (order.receitaGerada) {
        showAdminToast('Este pedido ja virou receita.', 'warning');
        return;
    }
    var finance = getFinance();
    finance.push({
        id: Date.now(),
        desc: 'Pedido site - ' + order.clienteNome,
        descricao: 'Pedido site - ' + order.clienteNome,
        valor: order.total,
        data: new Date().toISOString().slice(0, 10),
        cat: 'Produto',
        categoria: 'Produto',
        tipo: 'Receita',
        origem: 'Pedido Site',
        relacionadoA: order.id,
        observacoes: 'Receita gerada a partir do pedido do site.'
    });
    saveFinance(finance);
    updateOrder(orderId, function(o) { o.receitaGerada = true; });
    renderFinance();
    showAdminToast('Receita criada no financeiro!');
};

window.createDocumentFromOrder = function(orderId, type) {
    var order = findOrder(orderId);
    if (!order) return;
    createInternalDocumentPrompt(type, {
        clienteNome: order.clienteNome,
        clienteTelefone: order.telefone,
        descricao: 'Pedido do site',
        itens: (order.itens || []).map(function(item) {
            return { descricao: item.nome || 'Produto', quantidade: item.qty || item.quantidade || 1, valor: item.preco || 0 };
        }),
        valor: order.total,
        referenciaId: order.id,
        referenciaTipo: 'PEDIDO',
        origem: 'Pedido Site'
    });
};

window.requestOfficialNoteFromOrder = function(orderId) {
    var order = findOrder(orderId);
    if (!order) return;
    requestOfficialNotePrompt({
        clienteNome: order.clienteNome,
        clienteTelefone: order.telefone,
        descricao: 'Pedido do site',
        valor: order.total,
        status: 'Solicitada'
    });
};

window.registerOfficialNoteFromOrder = function(orderId) {
    var order = findOrder(orderId);
    if (!order) return;
    requestOfficialNotePrompt({
        clienteNome: order.clienteNome,
        clienteTelefone: order.telefone,
        descricao: 'Pedido do site',
        valor: order.total,
        status: 'Emitida'
    });
};

window.manualStockOutOrder = function(orderId) {
    var order = findOrder(orderId);
    if (!order) return;
    if (order.estoqueBaixado) {
        showAdminToast('Estoque ja foi baixado para este pedido.', 'warning');
        return;
    }
    if (!confirm('Baixar estoque manualmente dos itens deste pedido?')) return;
    var products = getProducts();
    (order.itens || []).forEach(function(item) {
        for (var i = 0; i < products.length; i++) {
            if (String(products[i].id) === String(item.id)) {
                products[i].estoque = Math.max(0, (parseInt(products[i].estoque) || 0) - (parseInt(item.qty || item.quantidade) || 1));
                products[i].atualizadoEm = new Date().toISOString();
            }
        }
    });
    saveProducts(products);
    updateOrder(orderId, function(o) { o.estoqueBaixado = true; });
    renderAdminProducts();
    showAdminToast('Estoque baixado manualmente!');
};

function getGuarantees() { 
    return JSON.parse(localStorage.getItem('kaos_guarantees') || '[]'); 
}

function saveGuarantees(data) { 
    localStorage.setItem('kaos_guarantees', JSON.stringify(data)); 
    if (window.KOSData) window.KOSData.saveCollection('guarantees', data);
}

function renderGuarantees(filter) {
    var guarantees = getGuarantees();
    var list = document.getElementById('guarantees-list');
    if (!list) return;
    
    if (filter) {
        var f = filter.toLowerCase();
        var filtered = [];
        for (var i = 0; i < guarantees.length; i++) {
            var g = guarantees[i];
            if (g.cliente.toLowerCase().includes(f) || g.equipamento.toLowerCase().includes(f)) {
                filtered.push(g);
            }
        }
        guarantees = filtered;
    }
    
    list.innerHTML = '';
    for (var i = guarantees.length - 1; i >= 0; i--) {
        var g = guarantees[i];
        var tr = document.createElement('tr');
        tr.innerHTML = '<td>#' + g.id.toString().slice(-4) + '</td><td>' + g.cliente + '</td><td>' + g.equipamento + '<td>' + (g.inicio ? g.inicio.split('-').reverse().join('/') : '-') + '<td>' + (g.fim ? g.fim.split('-').reverse().join('/') : '-') + '<td><span class="status-badge">' + g.status + '</span></td><td><button onclick="printGuaranteeAsPDF(' + g.id + ')" class="btn-edit-row" style="color:#25d366;"><i class="fas fa-file-pdf"></i></button></td>';
        list.appendChild(tr);
    }
}

window.printGuaranteeAsPDF = function(id) {
    var guarantees = getGuarantees();
    var g = null;
    for (var i = 0; i < guarantees.length; i++) {
        if (guarantees[i].id == id) {
            g = guarantees[i];
            break;
        }
    }
    if (!g) return;
    
    var htmlContent = '<!DOCTYPE html>\n' +
        '<html>\n' +
        '<head><meta charset="UTF-8"><title>Garantia_' + g.id + '</title>\n' +
        '<style>\n' +
        '    body { font-family: Arial; padding: 20px; }\n' +
        '    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px; }\n' +
        '    .content { max-width: 600px; margin: 0 auto; }\n' +
        '    .section { margin-bottom: 15px; }\n' +
        '    .signature { margin-top: 50px; border-top: 1px solid #000; padding-top: 8px; text-align: center; width: 250px; }\n' +
        '</style>\n' +
        '</head>\n' +
        '<body>\n' +
        '<div class="content">\n' +
        '    <div class="header"><h2>KB Tech</h2><p>Certificado de Garantia</p></div>\n' +
        '    <div class="section"><strong>Cliente:</strong> ' + g.cliente + '</div>\n' +
        '    <div class="section"><strong>Equipamento:</strong> ' + g.equipamento + '</div>\n' +
        '    <div class="section"><strong>Data de Início:</strong> ' + g.inicio + '</div>\n' +
        '    <div class="section"><strong>Data de Vencimento:</strong> ' + g.fim + '</div>\n' +
        '    <div class="section"><strong>Status:</strong> ' + g.status + '</div>\n' +
        '    <div class="signature">KB Tech</div>\n' +
        '</div>\n' +
        '</body>\n' +
        '</html>';
    
    var blob = new Blob([htmlContent], { type: 'text/html' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'Garantia_' + g.id + '_KB_Tech.html';
    a.click();
    URL.revokeObjectURL(url);
    showAdminToast('Garantia exportada!');
};

// Orcamentos
function getQuotes() { 
    return JSON.parse(localStorage.getItem('kaos_quotes') || '[]'); 
}

function saveQuotes(data) { 
    localStorage.setItem('kaos_quotes', JSON.stringify(data)); 
    if (window.KOSData) window.KOSData.saveCollection('quotes', data);
}

function renderQuotes() {
    var quotes = getQuotes();
    var customers = getCustomers();
    var list = document.getElementById('quotes-list');
    if (!list) return;
    list.innerHTML = '';
    for (var i = quotes.length - 1; i >= 0; i--) {
        var q = quotes[i];
        var c = null;
        for (var j = 0; j < customers.length; j++) {
            if (customers[j].id == q.customerId) {
                c = customers[j];
                break;
            }
        }
        var tr = document.createElement('tr');
        tr.innerHTML = '<td>#' + q.id.toString().slice(-4) + '</td><td>' + (c ? c.nome : 'Excluído') + '</td><td>' + (q.itens ? q.itens.substring(0, 30) : '-') + '<td>R$ ' + (q.valor || 0).toFixed(2).replace('.', ',') + '</td><td>' + (q.status || 'Pendente') + '<td><div class="table-actions"><button onclick="convertToOS(' + q.id + ')" class="btn-edit-row" style="color:#25d366;"><i class="fas fa-tools"></i></button><button onclick="editQuote(' + q.id + ')" class="btn-edit-row"><i class="fas fa-edit"></i></button><button onclick="deleteQuote(' + q.id + ')" class="btn-delete-row"><i class="fas fa-trash"></i></button></div></td>';
        list.appendChild(tr);
    }
}

// Financeiro
var FINANCE_EXPENSE_CATEGORIES = ['Ferramentas', 'Peças', 'Domínio', 'Hospedagem', 'Assinaturas', 'Marketing', 'Transporte', 'Embalagens', 'Software', 'Internet', 'Outros'];
var FINANCE_INCOME_CATEGORIES = ['Serviço', 'Produto', 'Entrega', 'Orçamento aprovado', 'Outro'];

function normalizeFinanceEntry(entry) {
    entry = entry || {};
    var created = entry.criadoEm || entry.createdAt || new Date().toISOString();
    var desc = entry.descricao || entry.desc || '';
    var cat = entry.categoria || entry.cat || (entry.tipo === 'Despesa' ? 'Outros' : 'Outro');
    return Object.assign({}, entry, {
        id: entry.id || Date.now(),
        tipo: entry.tipo === 'Despesa' ? 'Despesa' : 'Receita',
        descricao: desc,
        desc: desc,
        categoria: cat,
        cat: cat,
        valor: parseFloat(entry.valor) || 0,
        formaPagamento: entry.formaPagamento || '',
        data: entry.data || new Date().toISOString().slice(0, 10),
        origem: entry.origem || '',
        relacionadoA: entry.relacionadoA || '',
        observacoes: entry.observacoes || entry.obs || '',
        criadoEm: created
    });
}

function getFinance() { 
    return (JSON.parse(localStorage.getItem('kaos_finance') || '[]') || []).map(normalizeFinanceEntry); 
}

function saveFinance(data) { 
    var normalized = (data || []).map(normalizeFinanceEntry);
    localStorage.setItem('kaos_finance', JSON.stringify(normalized)); 
    if (window.KOSData) window.KOSData.saveCollection('finance', normalized);
}

function renderFinance() {
    var finance = getFinance();
    var list = document.getElementById('finance-list');
    if (!list) return;
    list.innerHTML = '';
    var totalReceitas = 0, totalDespesas = 0;
    for (var i = finance.length - 1; i >= 0; i--) {
        var f = finance[i];
        if (f.tipo === 'Receita') totalReceitas += f.valor;
        else totalDespesas += f.valor;
        var tr = document.createElement('tr');
        tr.innerHTML = '<td>' + (f.data ? f.data.split('-').reverse().join('/') : '-') + '</td><td>' + f.desc + '</td><td>' + f.cat + '<td><span class="status-badge ' + (f.tipo === 'Receita' ? 'status-pronto' : 'status-cancelado') + '">' + f.tipo + '</span></td><td>R$ ' + f.valor.toFixed(2).replace('.', ',') + '</td><td><button onclick="deleteFinance(' + f.id + ')" class="btn-delete-row"><i class="fas fa-trash"></i></button></td>';
        list.appendChild(tr);
    }
    var finReceitas = document.getElementById('fin-receitas');
    var finDespesas = document.getElementById('fin-despesas');
    var finLucro = document.getElementById('fin-lucro');
    if (finReceitas) finReceitas.textContent = 'R$ ' + totalReceitas.toFixed(2).replace('.', ',');
    if (finDespesas) finDespesas.textContent = 'R$ ' + totalDespesas.toFixed(2).replace('.', ',');
    if (finLucro) finLucro.textContent = 'R$ ' + (totalReceitas - totalDespesas).toFixed(2).replace('.', ',');
}

// Socios
function renderPartners() {
    var os = getOS();
    var partnersGrid = document.querySelector('.partners-grid');
    if (!partnersGrid) return;
    var totalServicos = 0;
    for (var i = 0; i < os.length; i++) {
        if (os[i].status === 'Entregue') {
            totalServicos += os[i].valorServico;
        }
    }
    partnersGrid.innerHTML = '<div class="stat-card"><h3>Kaique</h3><span class="stat-number">R$ ' + (totalServicos * 0.5).toFixed(2).replace('.', ',') + '</span><span class="stat-label">Comissão (50%)</span></div><div class="stat-card"><h3>Alex</h3><span class="stat-number">R$ ' + (totalServicos * 0.5).toFixed(2).replace('.', ',') + '</span><span class="stat-label">Comissão (50%)</span></div>';
}

// Socios
function renderDocuments() {
    var list = document.getElementById('documents-list');
    var empty = document.getElementById('documents-empty');
    if (!list) return;
    var docs = getDocuments();
    var type = document.getElementById('doc-filter-type')?.value || '';
    var client = (document.getElementById('doc-filter-client')?.value || '').toLowerCase();
    var start = document.getElementById('doc-filter-start')?.value || '';
    var end = document.getElementById('doc-filter-end')?.value || '';
    var status = document.getElementById('doc-filter-status')?.value || '';
    docs = docs.filter(function(d) {
        if (type && d.tipoDocumento !== type) return false;
        if (client && !(d.clienteNome || '').toLowerCase().includes(client)) return false;
        if (status && d.status !== status) return false;
        if (start && d.dataEmissao < start) return false;
        if (end && d.dataEmissao > end) return false;
        return true;
    });
    list.innerHTML = '';
    docs.slice().reverse().forEach(function(d) {
        var id = String(d.id).replace(/'/g, "\\'");
        var tr = document.createElement('tr');
        var actions = "<button onclick=\"viewDocument('" + id + "')\" class=\"btn-edit-row\" title=\"Visualizar\"><i class=\"fas fa-eye\"></i></button>" +
            "<button onclick=\"reprintDoc('" + id + "')\" class=\"btn-edit-row\" title=\"Imprimir\"><i class=\"fas fa-print\"></i></button>" +
            "<button onclick=\"editDocumentNotes('" + id + "')\" class=\"btn-edit-row\" title=\"Observacoes\"><i class=\"fas fa-pen\"></i></button>" +
            "<button onclick=\"deleteDocumentRecord('" + id + "')\" class=\"btn-delete-row\" title=\"Excluir\"><i class=\"fas fa-trash\"></i></button>";
        tr.innerHTML = '<td>' + (d.dataEmissao || '-') + '</td><td>' + d.tipoDocumento + '</td><td>' + (d.clienteNome || '-') + '</td><td>' + (d.referenciaTipo || '-') + ' #' + (d.referenciaId || '-') + '</td><td>' + formatBRL(d.valor) + '</td><td>' + d.status + '</td><td><div class="table-actions">' + actions + '</div></td>';
        list.appendChild(tr);
    });
    if (empty) empty.style.display = docs.length ? 'none' : 'block';
}
function saveDocumentRecord(tipo, cliente, ref) {
    var docs = getDocuments();
    docs.push(normalizeDocument({
        id: Date.now(),
        dataEmissao: new Date().toISOString().slice(0, 10),
        tipoDocumento: tipo,
        clienteNome: cliente,
        referenciaTipo: ref,
        status: 'Gerado'
    }));
    saveDocuments(docs);
    renderDocuments();
}

var INTERNAL_DOC_NOTICE = 'Este documento é um comprovante interno de atendimento/pagamento da KB Tech e não substitui Nota Fiscal eletrônica oficial.';
var DOC_TYPES = ['RECIBO', 'COMPROVANTE', 'ORDEM_SERVICO', 'GARANTIA', 'SOLICITACAO_NOTA_OFICIAL', 'NOTA_OFICIAL_REGISTRADA'];
var OFFICIAL_NOTE_STATUS = ['Solicitada', 'Em emissão externa', 'Emitida', 'Enviada ao cliente', 'Cancelada'];

function getCompanyConfig() {
    var defaults = {
        nomeEmpresa: 'KB Tech',
        responsavel: 'Kaique Bazil',
        cnpj: '',
        telefone: '(24) 99204-6467',
        whatsapp: '5524992046467',
        email: '',
        endereco: '',
        cidade: 'Petrópolis',
        estado: 'RJ',
        logo: 'img/logo-transparente.png',
        limiteMeiAnual: 81000
    };
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem('kaos_settings') || '{}'); } catch (err) {}
    return Object.assign({}, defaults, saved);
}

function saveCompanyConfig(config) {
    localStorage.setItem('kaos_settings', JSON.stringify(config));
    if (window.KOSData) window.KOSData.saveCollection('settings', config);
}

function getDocuments() {
    try { return (JSON.parse(localStorage.getItem('kaos_documents') || '[]') || []).map(normalizeDocument); } catch (err) { return []; }
}

function saveDocuments(docs) {
    var normalized = (docs || []).map(normalizeDocument);
    localStorage.setItem('kaos_documents', JSON.stringify(normalized));
    if (window.KOSData) window.KOSData.saveCollection('documents', normalized);
}

function normalizeDocument(doc) {
    doc = doc || {};
    var now = new Date().toISOString();
    return Object.assign({}, doc, {
        id: doc.id || Date.now(),
        tipoDocumento: doc.tipoDocumento || doc.tipo || 'COMPROVANTE',
        numeroDocumento: doc.numeroDocumento || ('DOC-' + String(doc.id || Date.now()).slice(-6)),
        clienteNome: doc.clienteNome || doc.cliente || '',
        descricao: doc.descricao || '',
        itens: doc.itens || [],
        valor: parseFloat(doc.valor) || 0,
        dataEmissao: doc.dataEmissao || doc.data || now.slice(0, 10),
        origem: doc.origem || '',
        referenciaId: doc.referenciaId || '',
        referenciaTipo: doc.referenciaTipo || doc.ref || '',
        status: doc.status || 'Gerado',
        observacoes: doc.observacoes || '',
        criadoEm: doc.criadoEm || now,
        atualizadoEm: doc.atualizadoEm || now
    });
}

function getOfficialNotes() {
    try { return (JSON.parse(localStorage.getItem('kaos_official_notes') || '[]') || []).map(normalizeOfficialNote); } catch (err) { return []; }
}

function saveOfficialNotes(notes) {
    var normalized = (notes || []).map(normalizeOfficialNote);
    localStorage.setItem('kaos_official_notes', JSON.stringify(normalized));
    if (window.KOSData) window.KOSData.saveCollection('officialNotes', normalized);
}

function normalizeOfficialNote(note) {
    note = note || {};
    var now = new Date().toISOString();
    return Object.assign({}, note, {
        id: note.id || Date.now(),
        clienteNome: note.clienteNome || '',
        tipoNota: note.tipoNota || 'NFS-e',
        descricao: note.descricao || '',
        valor: parseFloat(note.valor) || 0,
        dataSolicitacao: note.dataSolicitacao || now.slice(0, 10),
        status: note.status || 'Solicitada',
        criadoEm: note.criadoEm || now,
        atualizadoEm: note.atualizadoEm || now
    });
}

function ensureFiscalModule() {
    var navBtn = document.querySelector('[data-tab="documents"]');
    if (navBtn) navBtn.innerHTML = '<i class="fas fa-folder-open"></i> Fiscal / Documentos';
    var tab = document.getElementById('tab-documents');
    if (!tab || tab.getAttribute('data-fiscal-ready') === '1') return;
    tab.setAttribute('data-fiscal-ready', '1');
    tab.innerHTML =
        '<div class="admin-tab-header"><h1><i class="fas fa-folder-open"></i> Fiscal / Documentos</h1><div class="finance-actions"><button id="btn-new-receipt" class="btn-primary">Novo Recibo</button><button id="btn-new-proof" class="btn-secondary">Novo Comprovante</button><button id="btn-request-official-note" class="btn-primary">Cliente pediu Nota Fiscal</button><button id="btn-register-official-note" class="btn-secondary">Registrar Nota Oficial Emitida</button></div></div>' +
        '<div class="dashboard-grid" id="mei-control"></div>' +
        '<div class="dashboard-row"><div class="dashboard-col"><h3>Notas oficiais solicitadas</h3><div id="official-notes-list" class="orders-list"></div></div><div class="dashboard-col"><h3>Configuração KB Tech</h3><div id="company-config-card"></div></div></div>' +
        '<div class="admin-search-bar"><select id="doc-filter-type"><option value="">Todos os tipos</option>' + DOC_TYPES.map(function(t) { return '<option value="' + t + '">' + t + '</option>'; }).join('') + '</select><input id="doc-filter-client" placeholder="Cliente"><input type="date" id="doc-filter-start"><input type="date" id="doc-filter-end"><select id="doc-filter-status"><option value="">Status</option><option>Gerado</option><option>Solicitada</option><option>Emitida</option><option>Cancelada</option></select><button id="btn-apply-doc-filter" class="btn-secondary">Filtrar</button></div>' +
        '<div class="admin-table-wrapper"><table class="admin-table"><thead><tr><th>Data</th><th>Tipo</th><th>Cliente</th><th>Referência</th><th>Valor</th><th>Status</th><th>Ações</th></tr></thead><tbody id="documents-list"></tbody></table></div>';
    renderCompanyConfigCard();
}

function initFiscalActions() {
    var receipt = document.getElementById('btn-new-receipt');
    var proof = document.getElementById('btn-new-proof');
    var req = document.getElementById('btn-request-official-note');
    var reg = document.getElementById('btn-register-official-note');
    var filter = document.getElementById('btn-apply-doc-filter');
    if (receipt) receipt.onclick = function() { createInternalDocumentPrompt('RECIBO'); };
    if (proof) proof.onclick = function() { createInternalDocumentPrompt('COMPROVANTE'); };
    if (req) req.onclick = function() { requestOfficialNotePrompt({ status: 'Solicitada' }); };
    if (reg) reg.onclick = function() { requestOfficialNotePrompt({ status: 'Emitida' }); };
    if (filter) filter.onclick = renderDocuments;
}

function createInternalDocumentPrompt(type, source) {
    source = source || {};
    var clienteNome = prompt('Cliente', source.clienteNome || '') || '';
    if (!clienteNome) return;
    var descricao = prompt('Descrição do serviço/produto', source.descricao || '') || '';
    var valor = parseFloat(prompt('Valor', source.valor || '0')) || 0;
    var forma = prompt('Forma de pagamento', source.formaPagamento || '') || '';
    var data = {
        id: Date.now(),
        tipoDocumento: type,
        numeroDocumento: type.substring(0, 3) + '-' + Date.now().toString().slice(-6),
        clienteId: source.clienteId || '',
        clienteNome: clienteNome,
        clienteDocumento: source.clienteDocumento || '',
        clienteTelefone: source.clienteTelefone || '',
        descricao: descricao,
        itens: source.itens || [{ descricao: descricao, quantidade: 1, valor: valor }],
        valor: valor,
        formaPagamento: forma,
        dataEmissao: new Date().toISOString().slice(0, 10),
        origem: source.origem || 'Fiscal / Documentos',
        referenciaId: source.referenciaId || '',
        referenciaTipo: source.referenciaTipo || '',
        status: 'Gerado',
        observacoes: source.observacoes || INTERNAL_DOC_NOTICE
    };
    var docs = getDocuments();
    docs.push(data);
    saveDocuments(docs);
    renderDocuments();
    printFiscalDocument(data);
    if (confirm('Registrar também como receita no financeiro?')) createFinanceFromDocument(data);
}

function createFinanceFromDocument(doc) {
    var finance = getFinance();
    var exists = finance.some(function(f) { return String(f.relacionadoA) === String(doc.id) && f.origem === 'Documento Fiscal'; });
    if (exists) {
        showAdminToast('Receita já existe para este documento.', 'warning');
        return;
    }
    finance.push({
        id: Date.now(),
        tipo: 'Receita',
        categoria: doc.referenciaTipo === 'PEDIDO' ? 'Produto' : 'Serviço',
        cat: doc.referenciaTipo === 'PEDIDO' ? 'Produto' : 'Serviço',
        descricao: doc.tipoDocumento + ' - ' + doc.clienteNome,
        desc: doc.tipoDocumento + ' - ' + doc.clienteNome,
        valor: doc.valor,
        formaPagamento: doc.formaPagamento,
        data: doc.dataEmissao,
        origem: 'Documento Fiscal',
        relacionadoA: doc.id,
        observacoes: 'Receita vinculada ao documento ' + doc.numeroDocumento,
        criadoEm: new Date().toISOString()
    });
    saveFinance(finance);
    renderFinance();
}

function printFiscalDocument(doc) {
    var cfg = getCompanyConfig();
    var items = (doc.itens || []).map(function(item) {
        return '<tr><td>' + (item.descricao || item.nome || doc.descricao) + '</td><td>' + (item.quantidade || item.qty || 1) + '</td><td>' + formatBRL(item.valor || item.preco || doc.valor) + '</td></tr>';
    }).join('');
    var html = '<html><head><title>' + doc.tipoDocumento + '</title><style>body{font-family:Arial;padding:24px;color:#111}.header{display:flex;justify-content:space-between;border-bottom:2px solid #0066ff;padding-bottom:12px}img{max-height:70px}table{width:100%;border-collapse:collapse;margin-top:20px}td,th{border:1px solid #ddd;padding:8px;text-align:left}.notice{margin-top:28px;font-size:12px;color:#555;border-top:1px solid #ddd;padding-top:12px}.sign{margin-top:48px;border-top:1px solid #111;width:260px;text-align:center;padding-top:8px}</style></head><body><div class="header"><div><h2>' + cfg.nomeEmpresa + '</h2><p>' + cfg.telefone + ' - ' + cfg.cidade + '/' + cfg.estado + '</p><p>CNPJ: ' + (cfg.cnpj || '-') + '</p></div><img src="' + cfg.logo + '"></div><h1>' + doc.tipoDocumento.replace(/_/g, ' ') + '</h1><p><strong>Número:</strong> ' + doc.numeroDocumento + '</p><p><strong>Cliente:</strong> ' + doc.clienteNome + ' - ' + (doc.clienteTelefone || '-') + '</p><p><strong>Data:</strong> ' + doc.dataEmissao.split('-').reverse().join('/') + '</p><table><thead><tr><th>Descrição</th><th>Qtd</th><th>Valor</th></tr></thead><tbody>' + items + '</tbody></table><h2>Total: ' + formatBRL(doc.valor) + '</h2><p><strong>Pagamento:</strong> ' + (doc.formaPagamento || '-') + '</p><p><strong>Observações:</strong> ' + (doc.observacoes || '') + '</p><div class="sign">' + cfg.nomeEmpresa + '</div><div class="notice">' + INTERNAL_DOC_NOTICE + '</div></body></html>';
    var win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.print();
}

function requestOfficialNotePrompt(seed) {
    seed = seed || {};
    var note = {
        id: Date.now(),
        clienteNome: prompt('Cliente', seed.clienteNome || '') || '',
        clienteDocumento: prompt('CPF/CNPJ', seed.clienteDocumento || '') || '',
        clienteTelefone: prompt('Telefone', seed.clienteTelefone || '') || '',
        tipoNota: prompt('Tipo da nota (NFS-e, NF-e, NFC-e, Outro)', seed.tipoNota || 'NFS-e') || 'NFS-e',
        descricao: prompt('Descrição', seed.descricao || '') || '',
        valor: parseFloat(prompt('Valor', seed.valor || '0')) || 0,
        dataSolicitacao: new Date().toISOString().slice(0, 10),
        status: seed.status || 'Solicitada',
        numeroNota: seed.status === 'Emitida' ? (prompt('Número da nota', '') || '') : '',
        codigoVerificacao: seed.status === 'Emitida' ? (prompt('Código de verificação', '') || '') : '',
        linkNota: seed.status === 'Emitida' ? (prompt('Link da nota', '') || '') : '',
        arquivoPdfUrl: '',
        arquivoXmlUrl: '',
        emitidaPor: seed.status === 'Emitida' ? (prompt('Emitida por', 'Portal externo') || '') : '',
        dataEmissao: seed.status === 'Emitida' ? (prompt('Data de emissão (AAAA-MM-DD)', new Date().toISOString().slice(0, 10)) || '') : '',
        observacoes: prompt('Observações', seed.observacoes || '') || '',
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString()
    };
    if (!note.clienteNome) return;
    var notes = getOfficialNotes();
    notes.push(note);
    saveOfficialNotes(notes);
    renderOfficialNotes();
    var docs = getDocuments();
    docs.push(normalizeDocument({
        id: Date.now(),
        tipoDocumento: note.status === 'Emitida' ? 'NOTA_OFICIAL_REGISTRADA' : 'SOLICITACAO_NOTA_OFICIAL',
        numeroDocumento: 'NO-' + String(note.id).slice(-6),
        clienteNome: note.clienteNome,
        clienteDocumento: note.clienteDocumento,
        clienteTelefone: note.clienteTelefone,
        descricao: note.descricao,
        valor: note.valor,
        dataEmissao: note.dataSolicitacao,
        referenciaId: note.id,
        referenciaTipo: 'NOTA_OFICIAL',
        status: note.status,
        observacoes: note.observacoes
    }));
    saveDocuments(docs);
    renderDocuments();
}

function renderOfficialNotes() {
    var list = document.getElementById('official-notes-list');
    if (!list) return;
    var notes = getOfficialNotes();
    if (!notes.length) {
        list.innerHTML = '<div class="empty-list">Nenhuma nota oficial solicitada ou registrada.</div>';
        return;
    }
    list.innerHTML = '';
    notes.slice().reverse().forEach(function(note) {
        note = normalizeOfficialNote(note);
        var id = String(note.id).replace(/'/g, "\\'");
        var div = document.createElement('div');
        div.className = 'order-card';
        var statusButtons = OFFICIAL_NOTE_STATUS.map(function(st) {
            var safeStatus = st.replace(/'/g, "\\'");
            return "<button class=\"btn-edit-row\" onclick=\"setOfficialNoteStatus('" + id + "', '" + safeStatus + "')\" title=\"" + st + "\">" + st[0] + "</button>";
        }).join('');
        div.innerHTML = '<div class="order-card-header"><strong>' + note.clienteNome + '</strong><span class="order-date">' + note.status + '</span></div><div class="order-meta">' + note.tipoNota + ' - ' + formatBRL(note.valor) + '</div><div class="order-meta">' + (note.numeroNota ? 'Nota: ' + note.numeroNota : note.descricao) + '</div><div class="order-actions">' + statusButtons + "<button class=\"btn-edit-row\" onclick=\"editOfficialNoteData('" + id + "')\"><i class=\"fas fa-edit\"></i></button>" + '</div>';
        list.appendChild(div);
    });
}
window.setOfficialNoteStatus = function(id, status) {
    var notes = getOfficialNotes();
    notes.forEach(function(note) {
        if (String(note.id) === String(id)) {
            note.status = status;
            note.atualizadoEm = new Date().toISOString();
        }
    });
    saveOfficialNotes(notes);
    renderOfficialNotes();
};

window.editOfficialNoteData = function(id) {
    var notes = getOfficialNotes();
    var note = notes.find(function(n) { return String(n.id) === String(id); });
    if (!note) return;
    note.numeroNota = prompt('Número da nota', note.numeroNota || '') || note.numeroNota || '';
    note.codigoVerificacao = prompt('Código de verificação', note.codigoVerificacao || '') || note.codigoVerificacao || '';
    note.linkNota = prompt('Link da nota', note.linkNota || '') || note.linkNota || '';
    note.arquivoPdfUrl = prompt('URL do PDF', note.arquivoPdfUrl || '') || note.arquivoPdfUrl || '';
    note.arquivoXmlUrl = prompt('URL do XML', note.arquivoXmlUrl || '') || note.arquivoXmlUrl || '';
    note.status = prompt('Status', note.status || 'Emitida') || note.status;
    note.atualizadoEm = new Date().toISOString();
    saveOfficialNotes(notes);
    renderOfficialNotes();
};

function renderCompanyConfigCard() {
    var el = document.getElementById('company-config-card');
    if (!el) return;
    var cfg = getCompanyConfig();
    el.innerHTML = '<div class="backup-card"><p><strong>' + cfg.nomeEmpresa + '</strong><br>' + cfg.responsavel + '<br>' + cfg.telefone + '<br>' + cfg.cidade + '/' + cfg.estado + '</p><button id="btn-edit-company-config" class="btn-secondary">Editar dados</button></div>';
    var btn = document.getElementById('btn-edit-company-config');
    if (btn) btn.onclick = function() {
        cfg.nomeEmpresa = prompt('Nome da empresa', cfg.nomeEmpresa) || cfg.nomeEmpresa;
        cfg.responsavel = prompt('Responsável', cfg.responsavel) || cfg.responsavel;
        cfg.cnpj = prompt('CNPJ', cfg.cnpj) || cfg.cnpj;
        cfg.telefone = prompt('Telefone', cfg.telefone) || cfg.telefone;
        cfg.whatsapp = prompt('WhatsApp', cfg.whatsapp) || cfg.whatsapp;
        cfg.email = prompt('E-mail', cfg.email) || cfg.email;
        cfg.endereco = prompt('Endereço', cfg.endereco) || cfg.endereco;
        cfg.cidade = prompt('Cidade', cfg.cidade) || cfg.cidade;
        cfg.estado = prompt('Estado', cfg.estado) || cfg.estado;
        cfg.logo = prompt('Logo', cfg.logo) || cfg.logo;
        cfg.limiteMeiAnual = parseFloat(prompt('Limite anual MEI', cfg.limiteMeiAnual)) || cfg.limiteMeiAnual;
        saveCompanyConfig(cfg);
        renderCompanyConfigCard();
        renderMeiControl();
    };
}

function renderMeiControl() {
    var el = document.getElementById('mei-control');
    if (!el) return;
    var cfg = getCompanyConfig();
    var now = new Date();
    var finance = getFinance().filter(function(f) { return f.tipo === 'Receita'; });
    var monthRevenue = finance.filter(function(f) { return isInCurrentMonth(f.data); }).reduce(function(a, f) { return a + f.valor; }, 0);
    var yearRevenue = finance.filter(function(f) { var d = asDate(f.data); return d && d.getFullYear() === now.getFullYear(); }).reduce(function(a, f) { return a + f.valor; }, 0);
    var pct = cfg.limiteMeiAnual ? (yearRevenue / cfg.limiteMeiAnual) * 100 : 0;
    var avg = yearRevenue / (now.getMonth() + 1);
    var projection = avg * 12;
    var alert = pct >= 100 ? 'Atingiu 100% do limite anual' : (pct >= 80 ? 'Atingiu 80% do limite anual' : (pct >= 50 ? 'Atingiu 50% do limite anual' : 'Dentro do limite'));
    if (projection > cfg.limiteMeiAnual) alert += ' | Projeção anual acima do limite';
    el.innerHTML =
        '<div class="stat-card"><span class="stat-number">' + formatBRL(monthRevenue) + '</span><span class="stat-label">Faturamento do mês</span></div>' +
        '<div class="stat-card"><span class="stat-number">' + formatBRL(yearRevenue) + '</span><span class="stat-label">Faturamento do ano</span></div>' +
        '<div class="stat-card"><span class="stat-number">' + formatBRL(cfg.limiteMeiAnual) + '</span><span class="stat-label">Limite MEI</span></div>' +
        '<div class="stat-card"><span class="stat-number">' + pct.toFixed(1) + '%</span><span class="stat-label">Uso do limite</span></div>' +
        '<div class="stat-card"><span class="stat-number">' + formatBRL(avg) + '</span><span class="stat-label">Média mensal</span></div>' +
        '<div class="stat-card"><span class="stat-number">' + formatBRL(projection) + '</span><span class="stat-label">Projeção anual</span></div>' +
        '<div class="admin-alert ' + (pct >= 80 || projection > cfg.limiteMeiAnual ? 'alert-danger' : 'alert-warning') + '">' + alert + '</div>';
}

function emitirNotaOficialViaAPI(dadosNota) {
    return 'Função reservada para integração futura com API fiscal.';
}

// Backup
function initBackupSystem() {
    var btnExport = document.getElementById('btn-export-data');
    var btnImport = document.getElementById('btn-import-data');
    var importFile = document.getElementById('import-file');
    
    if (btnExport) {
        btnExport.onclick = function() {
            var data = { 
                products: getProducts(), 
                customers: getCustomers(), 
                os: getOS(), 
                guarantees: getGuarantees(), 
                quotes: getQuotes(), 
                finance: getFinance(), 
                documents: JSON.parse(localStorage.getItem('kaos_documents') || '[]'), 
                officialNotes: getOfficialNotes(),
                settings: getCompanyConfig(),
                shipping: getShipping(), 
                orders: JSON.parse(localStorage.getItem('katech_orders') || '[]'), 
                timestamp: new Date().toISOString() 
            };
            var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = 'backup_katech_' + new Date().toLocaleDateString().replace(/\//g, '-') + '.json';
            a.click();
            showAdminToast('Backup exportado!');
        };
    }
    
    if (btnImport && importFile) {
        btnImport.onclick = function() { importFile.click(); };
        importFile.onchange = function(e) {
            var file = e.target.files[0];
            if (!file) return;
            var reader = new FileReader();
            reader.onload = function(e) {
                try {
                    var data = JSON.parse(e.target.result);
                    if (confirm('Substituir todos os dados?')) {
                        if (data.products) saveProducts(data.products);
                        if (data.customers) saveCustomers(data.customers);
                        if (data.os) saveOS(data.os);
                        if (data.guarantees) saveGuarantees(data.guarantees);
                        if (data.quotes) saveQuotes(data.quotes);
                        if (data.finance) saveFinance(data.finance);
                        if (data.documents) saveDocuments(data.documents);
                        if (data.officialNotes) saveOfficialNotes(data.officialNotes);
                        if (data.settings) saveCompanyConfig(data.settings);
                        if (data.shipping) saveShipping(data.shipping);
                        if (data.orders) localStorage.setItem('katech_orders', JSON.stringify(data.orders));
                        if (window.KOSData) window.KOSData.importBackup(data);
                        showAdminToast('Backup restaurado! Reiniciando...');
                        setTimeout(function() { location.reload(); }, 1500);
                    }
                } catch (err) { 
                    showAdminToast('Erro no arquivo!', 'error'); 
                }
            };
            reader.readAsText(file);
        };
    }
}

// Socios
function initKaosSystem() {
    var btnAddItem = document.getElementById('btn-nf-add-item');
    if (btnAddItem) btnAddItem.onclick = addNfItemRow;
    
    var form = document.getElementById('kaos-nf-form');
    if (form) form.onsubmit = function(e) { e.preventDefault(); generateNFAsPDF(); };
    
    var previewBtn = document.getElementById('btn-nf-preview');
    if (previewBtn) previewBtn.onclick = function() { generateNFAsPDF(); };
    
    var nfData = document.getElementById('nf-data');
    if (nfData && !nfData.value) nfData.valueAsDate = new Date();
    addNfItemRow();
}

function addNfItemRow() {
    var container = document.getElementById('nf-items-container');
    if (!container) return;
    var products = getProducts();
    var options = '<option value="">Selecione</option>';
    for (var i = 0; i < products.length; i++) {
        options += '<option value="' + products[i].id + '" data-price="' + products[i].preco + '">' + products[i].nome + '</option>';
    }
    var row = document.createElement('div');
    row.className = 'nf-item-row';
    row.innerHTML = '<div class="form-group"><label>Produto</label><select class="nf-item-select">' + options + '</select></div><div class="form-group"><label>Qtd</label><input type="number" class="nf-item-qty" value="1" min="1"></div><div class="form-group"><label>Preço</label><input type="number" class="nf-item-price" step="0.01" value="0"></div><div class="form-group"><label>Subtotal</label><input type="text" class="nf-item-subtotal" readonly></div><button type="button" class="btn-remove-item"><i class="fas fa-trash"></i></button>';
    
    var sel = row.querySelector('.nf-item-select');
    var pr = row.querySelector('.nf-item-price');
    var qt = row.querySelector('.nf-item-qty');
    var sub = row.querySelector('.nf-item-subtotal');
    
    var update = function() { 
        sub.value = 'R$ ' + ((parseFloat(pr.value) || 0) * (parseInt(qt.value) || 0)).toFixed(2); 
    };
    sel.onchange = function() { 
        var opt = sel.options[sel.selectedIndex]; 
        if (opt.getAttribute('data-price')) pr.value = opt.getAttribute('data-price'); 
        update(); 
    };
    pr.oninput = update;
    qt.oninput = update;
    row.querySelector('.btn-remove-item').onclick = function() { row.remove(); };
    container.appendChild(row);
}

function generateNFAsPDF() {
    var total = 0;
    var itemsHtml = '';
    var rows = document.querySelectorAll('.nf-item-row');
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var select = row.querySelector('.nf-item-select');
        if (select && select.value) {
            var nome = select.options[select.selectedIndex]?.text || 'Produto';
            var q = parseInt(row.querySelector('.nf-item-qty')?.value) || 0;
            var p = parseFloat(row.querySelector('.nf-item-price')?.value) || 0;
            total += q * p;
            itemsHtml += '<tr><td>' + nome + '</td><td>' + q + '</td><td>R$ ' + p.toFixed(2).replace('.', ',') + '</td><td>R$ ' + (q * p).toFixed(2).replace('.', ',') + '</td></tr>';
        }
    }
    
    var clienteNome = document.getElementById('nf-cliente-nome')?.value || '';
    var clienteDoc = document.getElementById('nf-cliente-doc')?.value || '';
    
    var htmlContent = '<!DOCTYPE html>\n' +
        '<html>\n' +
        '<head><meta charset="UTF-8"><title>NF_KB_Tech</title>\n' +
        '<style>\n' +
        '    body { font-family: Arial; padding: 20px; }\n' +
        '    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px; }\n' +
        '    .company h2 { margin: 0; color: #0066ff; }\n' +
        '    .title { text-align: right; }\n' +
        '    table { width: 100%; border-collapse: collapse; margin: 15px 0; }\n' +
        '    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }\n' +
        '    th { background: #f5f5f5; }\n' +
        '    .signature { margin-top: 50px; border-top: 1px solid #000; padding-top: 8px; width: 250px; text-align: center; }\n' +
        '</style>\n' +
        '</head>\n' +
        '<body>\n' +
        '<div class="header">\n' +
        '    <div class="company"><h2>KB Tech</h2><p>CNPJ: 55.452.123/0001-89</p><p>Petrópolis, RJ</p></div>\n' +
        '    <div class="title"><h1>NOTA FISCAL</h1><p>Data: ' + new Date().toLocaleDateString() + '</p></div>\n' +
        '</div>\n' +
        '<div><strong>Cliente:</strong> ' + clienteNome + '<br><strong>CPF/CNPJ:</strong> ' + clienteDoc + '</div>\n' +
        '<table><thead><tr><th>Produto</th><th>Qtd</th><th>Unitário</th><th>Total</th></tr></thead>\n' +
        '<tbody>' + (itemsHtml || '<tr><td colspan="4">Nenhum produto</td></tr>') + '</tbody>\n' +
        '<tfoot><tr><td colspan="3" style="text-align:right"><strong>TOTAL:</strong></td><td><strong>R$ ' + total.toFixed(2).replace('.', ',') + '</strong></td></tr></tfoot>\n' +
        '</table>\n' +
        '<div class="signature">KB Tech</div>\n' +
        '</body>\n' +
        '</html>';
    
    var blob = new Blob([htmlContent], { type: 'text/html' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'NF_KB_Tech_' + new Date().toLocaleDateString().replace(/\//g, '-') + '.html';
    a.click();
    URL.revokeObjectURL(url);
    showAdminToast('Nota Fiscal exportada!');
}

function initResetCatalog() { 
    var btn = document.getElementById('btn-reset-catalog'); 
    if (btn) btn.onclick = function() { 
        if (confirm('Restaurar catálogo original?')) { 
            resetProducts(); 
            renderAdminProducts(); 
            showAdminToast('Catálogo restaurado!'); 
        } 
    }; 
}

function initClearOrders() { 
    var btn = document.getElementById('btn-clear-orders'); 
    if (btn) btn.onclick = function() { 
        if (confirm('Limpar pedidos?')) { 
            localStorage.setItem('katech_orders', '[]'); 
            if (window.KOSData) window.KOSData.saveCollection('orders', []);
            renderAdminOrders(); 
            showAdminToast('Pedidos limpos!'); 
        } 
    }; 
}

function convertToOS(quoteId) { 
    var quotes = getQuotes();
    var q = null;
    for (var i = 0; i < quotes.length; i++) {
        if (quotes[i].id == quoteId) {
            q = quotes[i];
            break;
        }
    }
    if (q) { 
        var os = getOS(); 
        os.push({ 
            id: Date.now(), 
            customerId: q.customerId, 
            data: new Date().toISOString().split('T')[0], 
            equipamento: 'Equipamento do Orçamento', 
            status: 'Aberto', 
            defeito: q.itens || '', 
            laudo: '', 
            valorServico: q.valor || 0, 
            valorPecas: 0, 
            garantia: 90, 
            pagamento: 'A definir' 
        }); 
        saveOS(os); 
        renderOS(); 
        showAdminToast('Orçamento convertido em OS!'); 
    } 
}

function editQuote(id) { 
    var quotes = getQuotes();
    var q = null;
    for (var i = 0; i < quotes.length; i++) {
        if (quotes[i].id == id) {
            q = quotes[i];
            break;
        }
    }
    if (q) { 
        document.getElementById('quote-id').value = q.id; 
        document.getElementById('quote-items').value = q.itens || ''; 
        document.getElementById('quote-valor').value = q.valor; 
        document.getElementById('quote-status').value = q.status || 'Pendente'; 
        
        var select = document.getElementById('quote-cust-id');
        var customers = getCustomers();
        select.innerHTML = '<option value="">Selecione</option>';
        for (var i = 0; i < customers.length; i++) {
            var opt = document.createElement('option');
            opt.value = customers[i].id;
            opt.textContent = customers[i].nome;
            if (customers[i].id == q.customerId) opt.selected = true;
            select.appendChild(opt);
        }
        
        var modal = document.getElementById('quote-modal'); 
        modal.style.display = 'flex'; 
        modal.classList.add('active'); 
        document.getElementById('overlay').classList.add('active'); 
    } 
}

function deleteQuote(id) { 
    if (confirm('Excluir orçamento?')) { 
        var quotes = getQuotes();
        var newQuotes = [];
        for (var i = 0; i < quotes.length; i++) {
            if (quotes[i].id != id) {
                newQuotes.push(quotes[i]);
            }
        }
        saveQuotes(newQuotes); 
        renderQuotes(); 
        showAdminToast('Orçamento excluído!'); 
    } 
}

function deleteFinance(id) { 
    if (confirm('Excluir lançamento?')) { 
        var finance = getFinance();
        var newFinance = [];
        for (var i = 0; i < finance.length; i++) {
            if (finance[i].id != id) {
                newFinance.push(finance[i]);
            }
        }
        saveFinance(newFinance); 
        renderFinance(); 
    } 
}

window.editFinance = function(id) {
    var finance = getFinance();
    var item = null;
    for (var i = 0; i < finance.length; i++) {
        if (finance[i].id == id) item = finance[i];
    }
    if (!item) return;
    var modal = document.getElementById('finance-modal');
    var overlay = document.getElementById('overlay');
    document.getElementById('finance-modal-title').textContent = 'Editar Lançamento';
    document.getElementById('fin-id').value = item.id;
    document.getElementById('fin-tipo').value = item.tipo;
    if (window.setFinanceCategories) window.setFinanceCategories(item.tipo, item.categoria || item.cat);
    document.getElementById('fin-desc').value = item.descricao || item.desc || '';
    document.getElementById('fin-valor').value = item.valor || 0;
    document.getElementById('fin-data').value = item.data || '';
    if (document.getElementById('fin-forma')) document.getElementById('fin-forma').value = item.formaPagamento || '';
    if (document.getElementById('fin-origem')) document.getElementById('fin-origem').value = item.origem || '';
    if (document.getElementById('fin-fornecedor')) document.getElementById('fin-fornecedor').value = item.fornecedor || '';
    if (document.getElementById('fin-relacionado')) document.getElementById('fin-relacionado').value = item.relacionadoA || '';
    if (document.getElementById('fin-recorrente')) document.getElementById('fin-recorrente').checked = !!item.recorrente;
    if (document.getElementById('fin-obs')) document.getElementById('fin-obs').value = item.observacoes || '';
    modal.style.display = 'flex';
    modal.classList.add('active');
    if (overlay) overlay.classList.add('active');
};

function getDocumentById(id) {
    return getDocuments().find(function(doc) { return String(doc.id) === String(id); });
}

window.viewDocument = function(id) {
    var doc = getDocumentById(id);
    if (doc) printFiscalDocument(doc);
};

function reprintDoc(id) { 
    var doc = getDocumentById(id);
    if (doc) printFiscalDocument(doc);
}

window.editDocumentNotes = function(id) {
    var docs = getDocuments();
    docs.forEach(function(doc) {
        if (String(doc.id) === String(id)) {
            doc.observacoes = prompt('Observações', doc.observacoes || '') || doc.observacoes;
            doc.atualizadoEm = new Date().toISOString();
        }
    });
    saveDocuments(docs);
    renderDocuments();
};

window.deleteDocumentRecord = function(id) {
    if (!confirm('Excluir este documento do histórico?')) return;
    saveDocuments(getDocuments().filter(function(doc) { return String(doc.id) !== String(id); }));
    renderDocuments();
};

function initQuoteModal() {
    var modal = document.getElementById('quote-modal');
    var form = document.getElementById('quote-form');
    var btnAdd = document.getElementById('btn-add-quote');
    var overlay = document.getElementById('overlay');
    
    if (btnAdd) {
        btnAdd.onclick = function() {
            form.reset();
            document.getElementById('quote-id').value = '';
            var select = document.getElementById('quote-cust-id');
            var customers = getCustomers();
            select.innerHTML = '<option value="">Selecione</option>';
            for (var i = 0; i < customers.length; i++) {
                select.innerHTML += '<option value="' + customers[i].id + '">' + customers[i].nome + '</option>';
            }
            modal.style.display = 'flex';
            modal.classList.add('active');
            if (overlay) overlay.classList.add('active');
        };
    }
    
    var closeModal = function() {
        modal.classList.remove('active');
        modal.style.display = 'none';
        if (overlay) overlay.classList.remove('active');
    };
    
    var btnClose = document.getElementById('close-quote-modal');
    var btnCancel = document.getElementById('cancel-quote-modal');
    if (btnClose) btnClose.onclick = closeModal;
    if (btnCancel) btnCancel.onclick = closeModal;
    
    form.onsubmit = function(e) {
        e.preventDefault();
        var quotes = getQuotes();
        var id = document.getElementById('quote-id').value;
        var data = { 
            id: id ? parseInt(id) : Date.now(), 
            customerId: parseInt(document.getElementById('quote-cust-id').value), 
            itens: document.getElementById('quote-items').value, 
            valor: parseFloat(document.getElementById('quote-valor').value) || 0, 
            status: document.getElementById('quote-status').value 
        };
        if (id) { 
            var idx = -1;
            for (var i = 0; i < quotes.length; i++) {
                if (quotes[i].id == id) {
                    idx = i;
                    break;
                }
            }
            if (idx !== -1) quotes[idx] = data; 
        } else { 
            quotes.push(data); 
        }
        saveQuotes(quotes);
        closeModal();
        renderQuotes();
        showAdminToast('Orçamento salvo!');
    };
}

function initFinanceModal() {
    var modal = document.getElementById('finance-modal');
    var form = document.getElementById('finance-form');
    var overlay = document.getElementById('overlay');
    
    var closeModal = function() {
        modal.classList.remove('active');
        modal.style.display = 'none';
        if (overlay) overlay.classList.remove('active');
    };
    
    var btnClose = document.getElementById('close-finance-modal');
    var btnCancel = document.getElementById('cancel-finance-modal');
    if (btnClose) btnClose.onclick = closeModal;
    if (btnCancel) btnCancel.onclick = closeModal;
    
    var btnIncome = document.getElementById('btn-add-income');
    var btnExpense = document.getElementById('btn-add-expense');
    function setFinanceCategories(type, selected) {
        var select = document.getElementById('fin-cat');
        if (!select) return;
        var categories = type === 'Despesa' ? FINANCE_EXPENSE_CATEGORIES : FINANCE_INCOME_CATEGORIES;
        select.innerHTML = categories.map(function(cat) {
            return '<option value="' + cat + '"' + (cat === selected ? ' selected' : '') + '>' + cat + '</option>';
        }).join('');
    }
    window.setFinanceCategories = setFinanceCategories;
    
    if (btnIncome) {
        btnIncome.onclick = function() {
            form.reset();
            document.getElementById('fin-id').value = '';
            document.getElementById('fin-tipo').value = 'Receita';
            setFinanceCategories('Receita');
            document.getElementById('finance-modal-title').textContent = 'Nova Receita';
            document.getElementById('fin-data').valueAsDate = new Date();
            modal.style.display = 'flex';
            modal.classList.add('active');
            if (overlay) overlay.classList.add('active');
        };
    }
    
    if (btnExpense) {
        btnExpense.onclick = function() {
            form.reset();
            document.getElementById('fin-id').value = '';
            document.getElementById('fin-tipo').value = 'Despesa';
            setFinanceCategories('Despesa');
            document.getElementById('finance-modal-title').textContent = 'Nova Despesa';
            document.getElementById('fin-data').valueAsDate = new Date();
            modal.style.display = 'flex';
            modal.classList.add('active');
            if (overlay) overlay.classList.add('active');
        };
    }
    
    form.onsubmit = function(e) {
        e.preventDefault();
        var finance = getFinance();
        var id = document.getElementById('fin-id').value;
        var existing = null;
        if (id) {
            for (var j = 0; j < finance.length; j++) {
                if (finance[j].id == id) existing = finance[j];
            }
        }
        var data = { 
            id: id || Date.now(), 
            desc: document.getElementById('fin-desc').value, 
            descricao: document.getElementById('fin-desc').value, 
            valor: parseFloat(document.getElementById('fin-valor').value) || 0, 
            data: document.getElementById('fin-data').value, 
            cat: document.getElementById('fin-cat').value, 
            categoria: document.getElementById('fin-cat').value,
            tipo: document.getElementById('fin-tipo').value,
            formaPagamento: document.getElementById('fin-forma') ? document.getElementById('fin-forma').value : '',
            origem: document.getElementById('fin-origem') ? document.getElementById('fin-origem').value : '',
            fornecedor: document.getElementById('fin-fornecedor') ? document.getElementById('fin-fornecedor').value : '',
            relacionadoA: document.getElementById('fin-relacionado') ? document.getElementById('fin-relacionado').value : '',
            recorrente: document.getElementById('fin-recorrente') ? document.getElementById('fin-recorrente').checked : false,
            observacoes: document.getElementById('fin-obs') ? document.getElementById('fin-obs').value : '',
            criadoEm: existing && existing.criadoEm ? existing.criadoEm : new Date().toISOString()
        };
        if (id) {
            for (var i = 0; i < finance.length; i++) {
                if (finance[i].id == id) finance[i] = data;
            }
        } else {
            finance.push(data);
        }
        saveFinance(finance);
        closeModal();
        renderFinance();
        showAdminToast('Lançamento salvo!');
    };
}

function formatBRL(value) {
    value = parseFloat(value) || 0;
    return 'R$ ' + value.toFixed(2).replace('.', ',');
}

function asDate(value) {
    if (!value) return null;
    var d = new Date(value);
    if (isNaN(d.getTime())) return null;
    return d;
}

function isInCurrentMonth(value) {
    var d = asDate(value);
    var now = new Date();
    return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

function groupByCategory(items, type) {
    var result = {};
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (type && item.tipo !== type) continue;
        var cat = item.cat || item.categoria || 'Outros';
        result[cat] = (result[cat] || 0) + (parseFloat(item.valor) || 0);
    }
    return result;
}

function renderCategorySummary(targetId, data) {
    var el = document.getElementById(targetId);
    if (!el) return;
    var keys = Object.keys(data).sort(function(a, b) { return data[b] - data[a]; });
    if (!keys.length) {
        el.innerHTML = '<p class="empty-state">Sem lancamentos.</p>';
        return;
    }
    el.innerHTML = keys.map(function(key) {
        return '<div class="finance-summary-row"><span>' + key + '</span><strong>' + formatBRL(data[key]) + '</strong></div>';
    }).join('');
}

function ensureFinanceSummaryBlocks() {
    if (document.getElementById('finance-income-categories')) return;
    var financeList = document.getElementById('finance-list');
    if (!financeList) return;
    var wrapper = financeList.closest('.admin-table-wrapper');
    if (!wrapper || !wrapper.parentNode) return;
    var html = document.createElement('div');
    html.innerHTML =
        '<div class="admin-search-bar finance-filter-bar">' +
        '<select id="finance-filter"><option value="today">Hoje</option><option value="week">Semana</option><option value="month" selected>Mês</option><option value="year">Ano</option><option value="custom">Período personalizado</option></select>' +
        '<input type="date" id="finance-start"><input type="date" id="finance-end">' +
        '<button id="btn-apply-finance" class="btn-secondary">Aplicar</button>' +
        '<button id="btn-finance-report" class="btn-primary">Gerar Relatório</button>' +
        '<button id="btn-finance-export" class="btn-secondary">Exportar JSON</button>' +
        '</div>' +
        '<div class="dashboard-row">' +
        '<div class="dashboard-col"><h3><i class="fas fa-arrow-up"></i> Receitas por Categoria</h3><div id="finance-income-categories" class="finance-summary-list"></div></div>' +
        '<div class="dashboard-col"><h3><i class="fas fa-arrow-down"></i> Despesas por Categoria</h3><div id="finance-expense-categories" class="finance-summary-list"></div></div>' +
        '</div>' +
        '<div class="admin-stats">' +
        '<div class="stat-card"><span class="stat-number" id="fin-investido">R$ 0,00</span><span class="stat-label">Investido na Empresa</span></div>' +
        '<div class="stat-card"><span class="stat-number" id="fin-saldo">R$ 0,00</span><span class="stat-label">Saldo Estimado</span></div>' +
        '<div class="stat-card"><span class="stat-number" id="fin-ticket">R$ 0,00</span><span class="stat-label">Ticket Medio</span></div>' +
        '<div class="stat-card"><span class="stat-number" id="fin-servicos">0</span><span class="stat-label">Serviços Realizados</span></div>' +
        '<div class="stat-card"><span class="stat-number" id="fin-produtos-vendidos">0</span><span class="stat-label">Produtos Vendidos</span></div>' +
        '</div>';
    while (html.firstChild) wrapper.parentNode.insertBefore(html.firstChild, wrapper);
}

function ensureReportsTab() {
    if (document.getElementById('tab-reports')) return;
    var nav = document.querySelector('.admin-nav');
    if (nav && !document.querySelector('[data-tab="reports"]')) {
        var btn = document.createElement('button');
        btn.className = 'admin-nav-btn';
        btn.setAttribute('data-tab', 'reports');
        btn.innerHTML = '<i class="fas fa-chart-pie"></i> Relatorios';
        var backupBtn = document.querySelector('[data-tab="backup"]');
        nav.insertBefore(btn, backupBtn || null);
    }
    var main = document.querySelector('.admin-main');
    if (!main) return;
    var tab = document.createElement('div');
    tab.id = 'tab-reports';
    tab.className = 'admin-tab';
    tab.innerHTML =
        '<div class="admin-tab-header"><h1><i class="fas fa-chart-pie"></i> Relatorios</h1><button id="btn-export-report" class="btn-primary"><i class="fas fa-file-download"></i> Exportar Relatorio</button></div>' +
        '<div class="admin-search-bar"><select id="report-filter"><option value="today">Hoje</option><option value="week">Semana</option><option value="month" selected>Mes</option><option value="year">Ano</option><option value="custom">Periodo personalizado</option></select><input type="date" id="report-start"><input type="date" id="report-end"><button id="btn-apply-report" class="btn-secondary">Aplicar</button></div>' +
        '<div class="admin-stats"><div class="stat-card"><span class="stat-number" id="rep-receitas">R$ 0,00</span><span class="stat-label">Receitas</span></div><div class="stat-card"><span class="stat-number" id="rep-despesas">R$ 0,00</span><span class="stat-label">Despesas</span></div><div class="stat-card"><span class="stat-number" id="rep-lucro">R$ 0,00</span><span class="stat-label">Lucro</span></div><div class="stat-card"><span class="stat-number" id="rep-os">0</span><span class="stat-label">OS</span></div><div class="stat-card"><span class="stat-number" id="rep-garantias">0</span><span class="stat-label">Garantias</span></div><div class="stat-card"><span class="stat-number" id="rep-clientes">0</span><span class="stat-label">Clientes</span></div><div class="stat-card"><span class="stat-number" id="rep-produtos">0</span><span class="stat-label">Produtos</span></div></div>' +
        '<div class="admin-table-wrapper"><table class="admin-table"><thead><tr><th>Modulo</th><th>Resumo</th><th>Valor</th></tr></thead><tbody id="reports-list"></tbody></table></div>';
    var backup = document.getElementById('tab-backup');
    main.insertBefore(tab, backup || null);
}

function ensureFinanceModalFields() {
    var select = document.getElementById('fin-cat');
    if (select) {
        var categories = FINANCE_INCOME_CATEGORIES;
        select.innerHTML = categories.map(function(cat) { return '<option value="' + cat + '">' + cat + '</option>'; }).join('');
    }
    if (document.getElementById('fin-forma')) return;
    var modalBody = document.querySelector('#finance-form .modal-body');
    if (!modalBody) return;
    var extra = document.createElement('div');
    extra.innerHTML =
        '<div class="form-row">' +
        '<div class="form-group"><label>Forma de Pagamento</label><input type="text" id="fin-forma" placeholder="Pix, cartao, dinheiro"></div>' +
        '<div class="form-group"><label>Origem / Fornecedor</label><input type="text" id="fin-origem" placeholder="OS, venda, ChatGPT Pro, dominio"></div>' +
        '</div>' +
        '<div class="form-row">' +
        '<div class="form-group"><label>Relacionado a</label><input type="text" id="fin-relacionado" placeholder="OS, pedido, produto"></div>' +
        '<div class="form-group"><label>Fornecedor</label><input type="text" id="fin-fornecedor" placeholder="Fornecedor da despesa"></div>' +
        '</div>' +
        '<label class="checkbox-label"><input type="checkbox" id="fin-recorrente"><span>Despesa recorrente</span></label>' +
        '<div class="form-group"><label>Observacoes</label><textarea id="fin-obs" rows="2" placeholder="Ex: ChatGPT Pro R$100, dominio R$60, peca R$180, anuncio Instagram R$50"></textarea></div>';
    while (extra.firstChild) modalBody.appendChild(extra.firstChild);
}

function getReportRange() {
    var filter = document.getElementById('report-filter');
    var value = filter ? filter.value : 'month';
    var now = new Date();
    var start = new Date(now);
    var end = new Date(now);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    if (value === 'week') start.setDate(now.getDate() - now.getDay());
    if (value === 'month') start = new Date(now.getFullYear(), now.getMonth(), 1);
    if (value === 'year') start = new Date(now.getFullYear(), 0, 1);
    if (value === 'custom') {
        var s = document.getElementById('report-start');
        var e = document.getElementById('report-end');
        if (s && s.value) start = new Date(s.value);
        if (e && e.value) end = new Date(e.value);
        end.setHours(23, 59, 59, 999);
    }
    return { start: start, end: end };
}

function getFinanceRange() {
    var filter = document.getElementById('finance-filter');
    var value = filter ? filter.value : 'month';
    var now = new Date();
    var start = new Date(now);
    var end = new Date(now);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    if (value === 'week') start.setDate(now.getDate() - now.getDay());
    if (value === 'month') start = new Date(now.getFullYear(), now.getMonth(), 1);
    if (value === 'year') start = new Date(now.getFullYear(), 0, 1);
    if (value === 'custom') {
        var s = document.getElementById('finance-start');
        var e = document.getElementById('finance-end');
        if (s && s.value) start = new Date(s.value);
        if (e && e.value) end = new Date(e.value);
        end.setHours(23, 59, 59, 999);
    }
    return { start: start, end: end, label: value };
}

function inRange(value, range) {
    var d = asDate(value);
    return d && d >= range.start && d <= range.end;
}

function countServicesInRange(range) {
    return getOS().filter(function(o) {
        var done = o.status === 'Entregue' || o.status === 'Pronto' || o.status === 'Concluído';
        return done && inRange(o.dataConclusao || o.data || o.dataEntrada, range);
    }).length;
}

function countProductsSoldInRange(range) {
    return getOrders().filter(function(order) {
        return (order.status === 'Pago' || order.status === 'Entregue') && inRange(order.dataPedido || order.data, range);
    }).reduce(function(total, order) {
        return total + (order.itens || []).reduce(function(acc, item) {
            return acc + (parseInt(item.qty || item.quantidade) || 1);
        }, 0);
    }, 0);
}

function exportJsonFile(filename, data) {
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function buildFinanceReport() {
    var range = getFinanceRange();
    var items = getFinance().filter(function(f) { return inRange(f.data, range); });
    var receitas = items.filter(function(f) { return f.tipo === 'Receita'; }).reduce(function(a, f) { return a + f.valor; }, 0);
    var despesas = items.filter(function(f) { return f.tipo === 'Despesa'; }).reduce(function(a, f) { return a + f.valor; }, 0);
    var invested = getProducts().reduce(function(acc, p) { return acc + ((parseFloat(p.precoCusto || p.custo) || 0) * (parseFloat(p.estoque) || 0)); }, 0);
    return {
        periodo: range,
        receitas: receitas,
        despesas: despesas,
        lucroLiquido: receitas - despesas,
        totalInvestido: invested,
        saldoEstimado: (receitas - despesas) - invested,
        ticketMedio: items.filter(function(f) { return f.tipo === 'Receita'; }).length ? receitas / items.filter(function(f) { return f.tipo === 'Receita'; }).length : 0,
        servicosRealizados: countServicesInRange(range),
        produtosVendidos: countProductsSoldInRange(range),
        receitasPorCategoria: groupByCategory(items, 'Receita'),
        despesasPorCategoria: groupByCategory(items.filter(function(f) { return f.tipo === 'Despesa'; })),
        lancamentos: items
    };
}

function renderReports() {
    ensureReportsTab();
    var range = getReportRange();
    var finance = getFinance().filter(function(f) { return inRange(f.data, range); });
    var os = getOS().filter(function(o) { return inRange(o.data || o.dataEntrada, range); });
    var guarantees = getGuarantees().filter(function(g) { return inRange(g.inicio || g.dataInicio, range); });
    var customers = getCustomers().filter(function(c) { return !c.dataCadastro || inRange(c.dataCadastro, range); });
    var products = getProducts();
    var receitas = finance.filter(function(f) { return f.tipo === 'Receita'; }).reduce(function(a, f) { return a + (parseFloat(f.valor) || 0); }, 0);
    var despesas = finance.filter(function(f) { return f.tipo !== 'Receita'; }).reduce(function(a, f) { return a + (parseFloat(f.valor) || 0); }, 0);
    var values = {
        'rep-receitas': formatBRL(receitas),
        'rep-despesas': formatBRL(despesas),
        'rep-lucro': formatBRL(receitas - despesas),
        'rep-os': os.length,
        'rep-garantias': guarantees.length,
        'rep-clientes': customers.length,
        'rep-produtos': products.length
    };
    Object.keys(values).forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.textContent = values[id];
    });
    var list = document.getElementById('reports-list');
    if (list) {
        list.innerHTML =
            '<tr><td>Receitas</td><td>' + finance.filter(function(f) { return f.tipo === 'Receita'; }).length + ' lancamentos</td><td>' + formatBRL(receitas) + '</td></tr>' +
            '<tr><td>Despesas</td><td>' + finance.filter(function(f) { return f.tipo !== 'Receita'; }).length + ' lancamentos</td><td>' + formatBRL(despesas) + '</td></tr>' +
            '<tr><td>OS</td><td>' + os.length + ' ordens no periodo</td><td>-</td></tr>' +
            '<tr><td>Garantias</td><td>' + guarantees.length + ' garantias no periodo</td><td>-</td></tr>' +
            '<tr><td>Clientes</td><td>' + customers.length + ' clientes no periodo</td><td>-</td></tr>' +
            '<tr><td>Produtos</td><td>' + products.length + ' produtos cadastrados</td><td>-</td></tr>';
    }
}

function initReports() {
    var btn = document.getElementById('btn-apply-report');
    var exportBtn = document.getElementById('btn-export-report');
    if (btn) btn.onclick = renderReports;
    if (exportBtn) exportBtn.onclick = function() {
        renderReports();
        var data = {
            periodo: getReportRange(),
            receitas: document.getElementById('rep-receitas')?.textContent || '',
            despesas: document.getElementById('rep-despesas')?.textContent || '',
            lucro: document.getElementById('rep-lucro')?.textContent || '',
            os: getOS(),
            garantias: getGuarantees(),
            clientes: getCustomers(),
            produtos: getProducts()
        };
        var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'relatorio_kos_' + new Date().toISOString().slice(0, 10) + '.json';
        a.click();
        URL.revokeObjectURL(url);
    };
}

function initFinanceFilters() {
    var applyBtn = document.getElementById('btn-apply-finance');
    var reportBtn = document.getElementById('btn-finance-report');
    var exportBtn = document.getElementById('btn-finance-export');
    var filter = document.getElementById('finance-filter');
    if (applyBtn) applyBtn.onclick = renderFinance;
    if (filter) filter.onchange = renderFinance;
    if (reportBtn) reportBtn.onclick = function() {
        var report = buildFinanceReport();
        showAdminToast('Relatório financeiro gerado.');
        exportJsonFile('relatorio_financeiro_kos_' + new Date().toISOString().slice(0, 10) + '.json', report);
    };
    if (exportBtn) exportBtn.onclick = function() {
        exportJsonFile('financeiro_kos_' + new Date().toISOString().slice(0, 10) + '.json', {
            exportadoEm: new Date().toISOString(),
            financeiro: getFinance()
        });
    };
}

function renderFinance() {
    ensureFinanceSummaryBlocks();
    var finance = getFinance();
    var list = document.getElementById('finance-list');
    if (!list) return;
    list.innerHTML = '';
    var range = getFinanceRange();
    var periodItems = finance.filter(function(f) { return inRange(f.data, range); });
    var totalReceitas = 0, totalDespesas = 0;
    periodItems.forEach(function(f) {
        if (f.tipo === 'Receita') totalReceitas += parseFloat(f.valor) || 0;
        else totalDespesas += parseFloat(f.valor) || 0;
    });
    periodItems.sort(function(a, b) { return new Date(b.data) - new Date(a.data); });
    for (var i = 0; i < periodItems.length; i++) {
        var f = periodItems[i];
        var financeId = String(f.id).replace(/'/g, "\\'");
        var tr = document.createElement('tr');
        tr.innerHTML = '<td>' + (f.data ? f.data.split('-').reverse().join('/') : '-') + '</td><td>' + (f.descricao || '-') + '<br><small>' + (f.origem || '-') + '</small></td><td>' + (f.categoria || '-') + '</td><td><span class="status-badge ' + (f.tipo === 'Receita' ? 'status-pronto' : 'status-cancelado') + '">' + (f.tipo || '-') + '</span></td><td>' + formatBRL(f.valor) + '</td><td><div class="table-actions"><button onclick="editFinance(\'' + financeId + '\')" class="btn-edit-row"><i class="fas fa-edit"></i></button><button onclick="deleteFinance(\'' + financeId + '\')" class="btn-delete-row"><i class="fas fa-trash"></i></button></div></td>';
        list.appendChild(tr);
    }
    var ticketBase = periodItems.filter(function(f) { return f.tipo === 'Receita'; });
    var ticket = ticketBase.length ? totalReceitas / ticketBase.length : 0;
    var invested = getProducts().reduce(function(acc, p) { return acc + ((parseFloat(p.precoCusto || p.custo) || 0) * (parseFloat(p.estoque) || 0)); }, 0);
    var fields = {
        'fin-receitas': formatBRL(totalReceitas),
        'fin-despesas': formatBRL(totalDespesas),
        'fin-lucro': formatBRL(totalReceitas - totalDespesas),
        'fin-investido': formatBRL(invested),
        'fin-saldo': formatBRL((totalReceitas - totalDespesas) - invested),
        'fin-ticket': formatBRL(ticket),
        'fin-servicos': countServicesInRange(range),
        'fin-produtos-vendidos': countProductsSoldInRange(range)
    };
    Object.keys(fields).forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.textContent = fields[id];
    });
    renderCategorySummary('finance-income-categories', groupByCategory(periodItems, 'Receita'));
    renderCategorySummary('finance-expense-categories', groupByCategory(periodItems.filter(function(f) { return f.tipo === 'Despesa'; })));
}

function renderDashboard() {
    var os = getOS();
    var customers = getCustomers();
    var products = getProducts();
    var finance = getFinance();
    var receitasMes = finance.filter(function(f) { return f.tipo === 'Receita' && isInCurrentMonth(f.data); }).reduce(function(a, f) { return a + (parseFloat(f.valor) || 0); }, 0);
    var despesasMes = finance.filter(function(f) { return f.tipo !== 'Receita' && isInCurrentMonth(f.data); }).reduce(function(a, f) { return a + (parseFloat(f.valor) || 0); }, 0);
    var osAbertas = os.filter(function(o) { return o.status === 'Aberto' || o.status === 'Em Análise' || o.status === 'Aguardando Peça'; }).length;
    var estoqueBaixo = products.filter(function(p) { return p.estoque <= (p.estoqueMin || p.estoqueMinimo || 5); }).length;
    var invested = products.reduce(function(acc, p) { return acc + ((parseFloat(p.custo) || parseFloat(p.precoCusto) || 0) * (parseFloat(p.estoque) || 0)); }, 0);
    var revenueItems = finance.filter(function(f) { return f.tipo === 'Receita' && isInCurrentMonth(f.data); });
    var ticket = revenueItems.length ? receitasMes / revenueItems.length : 0;
    var fields = {
        'dash-vendas-mes': formatBRL(receitasMes),
        'dash-lucro-mes': formatBRL(receitasMes - despesasMes),
        'dash-os-abertas': osAbertas,
        'dash-estoque-baixo': estoqueBaixo,
        'dash-investido': formatBRL(invested),
        'dash-ticket-medio': formatBRL(ticket)
    };
    Object.keys(fields).forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.textContent = fields[id];
    });
    var dashOsList = document.getElementById('dash-os-list');
    if (dashOsList) {
        dashOsList.innerHTML = '';
        os.slice(-5).reverse().forEach(function(o) {
            var c = customers.find(function(cust) { return cust.id == (o.customerId || o.clienteId); });
            var statusClass = (o.status || 'aberto').toLowerCase().replace(/ /g, '');
            var total = (parseFloat(o.valorServico || o.valorMaoObra) || 0) + (parseFloat(o.valorPecas) || 0);
            var tr = document.createElement('tr');
            tr.innerHTML = '<td>' + (c ? c.nome : (o.clienteNome || 'Excluido')) + '</td><td>' + (o.equipamento || '-') + '</td><td><span class="status-badge status-' + statusClass + '">' + (o.status || 'Aberto') + '</span></td><td>' + formatBRL(total) + '</td>';
            dashOsList.appendChild(tr);
        });
    }

    var alerts = document.getElementById('dash-notifications');
    if (alerts) {
        var low = products.filter(function(p) { return p.ativo !== false && p.estoque > 0 && p.estoque <= (p.estoqueMinimo || p.estoqueMin || 5); });
        var zero = products.filter(function(p) { return p.ativo !== false && p.estoque <= 0; });
        var html = '';
        if (zero.length) html += '<div class="admin-alert alert-danger"><strong>Estoque zerado:</strong> ' + zero.map(function(p) { return p.nome; }).slice(0, 5).join(', ') + (zero.length > 5 ? '...' : '') + '</div>';
        if (low.length) html += '<div class="admin-alert alert-warning"><strong>Estoque baixo:</strong> ' + low.map(function(p) { return p.nome; }).slice(0, 5).join(', ') + (low.length > 5 ? '...' : '') + '</div>';
        alerts.innerHTML = html;
    }
}

