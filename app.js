const App = {
    init: () => {
        Dashboard.render();
        Clientes.render();
        Ordens.render();
        // Setar data atual na OS
        document.getElementById('os-entrada').value = new Date().toISOString().split('T')[0];
    },

    navigate: (viewId) => {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
        
        document.getElementById(`view-${viewId}`).classList.add('active');
        event.currentTarget.classList.add('active');
    },

    search: (termo) => {
        // Decide qual aba está ativa para filtrar localmente
        const activeView = document.querySelector('.view.active').id;
        if(activeView === 'view-clientes') {
            Clientes.render(termo);
        } else if (activeView === 'view-ordens') {
            Ordens.render(termo);
        } else {
            // Se estiver no dashboard, muda pra ordens e pesquisa
            App.navigate('ordens');
            document.querySelector('nav button:nth-child(3)').classList.add('active');
            Ordens.render(termo);
        }
    }
};

// Start App when DOM is loaded
document.addEventListener('DOMContentLoaded', App.init);