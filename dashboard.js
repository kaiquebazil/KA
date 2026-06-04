const Dashboard = {
    render: () => {
        const clientes = StorageDB.get('clientes');
        const ordens = StorageDB.get('ordens');

        const abertas = ordens.filter(o => o.status !== 'Finalizado' && o.status !== 'Entregue').length;
        const finalizadas = ordens.filter(o => o.status === 'Finalizado' || o.status === 'Entregue').length;
        const faturamento = ordens
            .filter(o => o.status === 'Entregue' || o.status === 'Finalizado')
            .reduce((acc, o) => acc + (parseFloat(o.valor) || 0), 0);

        document.getElementById('dash-clientes').innerText = clientes.length;
        document.getElementById('dash-abertas').innerText = abertas;
        document.getElementById('dash-finalizadas').innerText = finalizadas;
        document.getElementById('dash-faturamento').innerText = `R$ ${faturamento.toFixed(2).replace('.', ',')}`;
    }
};