const Clientes = {
    save: (e) => {
        e.preventDefault();
        const id = document.getElementById('cli-id').value || Date.now().toString();
        const cliente = {
            id,
            nome: document.getElementById('cli-nome').value,
            telefone: document.getElementById('cli-telefone').value,
            cpf: document.getElementById('cli-cpf').value,
            cidade: document.getElementById('cli-cidade').value,
            obs: document.getElementById('cli-obs').value
        };

        let clientes = StorageDB.get('clientes');
        const index = clientes.findIndex(c => c.id == id);
        if (index >= 0) clientes[index] = cliente;
        else clientes.push(cliente);

        StorageDB.set('clientes', clientes);
        e.target.reset();
        document.getElementById('cli-id').value = '';
        Clientes.render();
        Dashboard.render();
    },

    render: (filtro = '') => {
        const clientes = StorageDB.get('clientes');
        const tbody = document.getElementById('table-clientes');
        tbody.innerHTML = '';

        clientes.filter(c => 
            c.nome.toLowerCase().includes(filtro.toLowerCase()) || 
            c.telefone.includes(filtro) ||
            (c.cpf && c.cpf.includes(filtro))
        ).forEach(c => {
            tbody.innerHTML += `
                <tr>
                    <td>${c.nome}</td>
                    <td>${c.telefone}</td>
                    <td>${c.cpf || 'Não informado'}</td>
                    <td>${c.cidade}</td>
                    <td>
                        <button class="btn-sm" onclick="Clientes.edit('${c.id}')">Editar</button>
                        <button class="btn-sm" onclick="Clientes.delete('${c.id}')">Excluir</button>
                    </td>
                </tr>
            `;
        });
    },

    edit: (id) => {
        const c = StorageDB.get('clientes').find(c => c.id == id);
        if(c) {
            document.getElementById('cli-id').value = c.id;
            document.getElementById('cli-nome').value = c.nome;
            document.getElementById('cli-telefone').value = c.telefone;
            document.getElementById('cli-cpf').value = c.cpf || '';
            document.getElementById('cli-cidade').value = c.cidade;
            document.getElementById('cli-obs').value = c.obs;
        }
    },

    delete: (id) => {
        if(confirm('Excluir cliente?')) {
            const clientes = StorageDB.get('clientes').filter(c => c.id != id);
            StorageDB.set('clientes', clientes);
            Clientes.render();
            Dashboard.render();
        }
    }
};