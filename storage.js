const StorageDB = {
    get: (key) => JSON.parse(localStorage.getItem(key)) || [],
    set: (key, data) => localStorage.setItem(key, JSON.stringify(data)),
    
    exportar: () => {
        const data = {
            clientes: StorageDB.get('clientes'),
            ordens: StorageDB.get('ordens')
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kb_os_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },

    importar: () => {
        const fileInput = document.getElementById('file-import');
        const file = fileInput.files[0];
        if (!file) return alert('Selecione um arquivo JSON.');

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.clientes) StorageDB.set('clientes', data.clientes);
                if (data.ordens) StorageDB.set('ordens', data.ordens);
                alert('Dados importados com sucesso!');
                location.reload();
            } catch (err) {
                alert('Erro ao ler o arquivo. Formato inválido.');
            }
        };
        reader.readAsText(file);
    }
};