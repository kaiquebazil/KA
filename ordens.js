const Ordens = {
    save: (e) => {
        e.preventDefault();
        let ordens = StorageDB.get('ordens');
        
        // Gerador de ID incremental automático
        const nextId = ordens.length > 0 ? Math.max(...ordens.map(o => parseInt(o.id))) + 1 : 1;
        const currentId = document.getElementById('os-id').value || nextId;

        const os = {
            id: currentId,
            cliente: document.getElementById('os-cliente').value,
            telefone: document.getElementById('os-telefone').value,
            cpf: document.getElementById('os-cpf').value, // NOVO CAMPO SALVO AQUI
            equipamento: document.getElementById('os-equipamento').value,
            marca: document.getElementById('os-marca').value,
            modelo: document.getElementById('os-modelo').value,
            defeito: document.getElementById('os-defeito').value,
            servico: document.getElementById('os-servico').value,
            valor: document.getElementById('os-valor').value,
            entrada: document.getElementById('os-entrada').value,
            entrega: document.getElementById('os-entrega').value,
            garantia: document.getElementById('os-garantia').value,
            status: document.getElementById('os-status').value
        };

        const index = ordens.findIndex(o => o.id == currentId);
        if (index >= 0) ordens[index] = os;
        else ordens.push(os);

        StorageDB.set('ordens', ordens);
        e.target.reset();
        document.getElementById('os-id').value = '';
        
        // Seta data de entrada como hoje por padrão após salvar
        document.getElementById('os-entrada').value = new Date().toISOString().split('T')[0];
        
        Ordens.render();
        Dashboard.render();
    },

    render: (filtro = '') => {
        const ordens = StorageDB.get('ordens');
        const tbody = document.getElementById('table-ordens');
        tbody.innerHTML = '';

        ordens.filter(o => 
            o.id.toString().includes(filtro) ||
            o.cliente.toLowerCase().includes(filtro.toLowerCase()) || 
            o.equipamento.toLowerCase().includes(filtro.toLowerCase()) ||
            (o.cpf && o.cpf.includes(filtro))
        ).forEach(o => {
            tbody.innerHTML += `
                <tr>
                    <td>#${o.id}</td>
                    <td>${o.cliente}</td>
                    <td>${o.equipamento}</td>
                    <td>${o.status}</td>
                    <td>R$ ${o.valor || '0.00'}</td>
                    <td>
                        <button class="btn-sm" onclick="Ordens.edit('${o.id}')">Editar</button>
                        <button class="btn-sm" style="background-color: var(--text-light); color: var(--bg-dark); font-weight: bold;" onclick="PDF.gerarOS('${o.id}')">🖨️ Imprimir Documento</button>
                    </td>
                </tr>
            `;
        });
    },

    edit: (id) => {
        const o = StorageDB.get('ordens').find(o => o.id == id);
        if(o) {
            document.getElementById('os-id').value = o.id;
            // Adicionado 'cpf' na lista de campos para preencher ao editar
            ['cliente','telefone','cpf','equipamento','marca','modelo','defeito','servico','valor','entrada','entrega','garantia','status'].forEach(campo => {
                if(document.getElementById(`os-${campo}`)) {
                    document.getElementById(`os-${campo}`).value = o[campo] || '';
                }
            });
        }
    }
};