const PDF = {
    imprimirDocumento: (titulo, conteudoHTML) => {
        const janela = window.open('', '', 'height=800,width=800');
        janela.document.write(`
            <html>
            <head>
                <title>${titulo}</title>
                <style>
                    /* Estilo para impressão em uma folha A4 */
                    @page { margin: 10mm; }
                    body { font-family: Arial, sans-serif; margin: 0; padding: 0; color: #000; }
                    .danfe-container { border: 2px solid #000; padding: 10px; max-width: 100%; box-sizing: border-box; }
                    
                    /* Cabeçalho */
                    .header-box { display: flex; border: 1px solid #000; margin-bottom: 10px; }
                    .logo-area { width: 30%; border-right: 1px solid #000; padding: 15px; text-align: center; display: flex; align-items: center; justify-content: center; background-color: #f4f4f4; }
                    .logo-area h1 { margin: 0; font-size: 28px; font-weight: 900; text-transform: uppercase; color: #000; }
                    .info-area { width: 45%; border-right: 1px solid #000; padding: 10px; text-align: center; font-size: 12px; line-height: 1.4; }
                    .os-area { width: 25%; padding: 10px; text-align: center; display: flex; flex-direction: column; justify-content: center; }
                    
                    /* Quadros de Dados */
                    .section-title { font-weight: bold; font-size: 10px; text-transform: uppercase; margin-top: 5px; }
                    .box-row { display: flex; border: 1px solid #000; margin-bottom: 5px; background: #fff; }
                    .box-field { padding: 5px; border-right: 1px solid #000; flex: 1; }
                    .box-field:last-child { border-right: none; }
                    .box-field span { display: block; font-size: 9px; text-transform: uppercase; color: #333; margin-bottom: 3px; }
                    .box-field strong { font-size: 13px; display: block; }
                    
                    /* Assinaturas */
                    .termo { font-size: 10px; margin-top: 15px; text-align: justify; line-height: 1.5; padding: 5px; border: 1px dashed #666; }
                    .signatures { display: flex; justify-content: space-between; margin-top: 40px; padding: 0 20px; }
                    .sig-line { border-top: 1px solid #000; width: 40%; text-align: center; padding-top: 5px; font-size: 11px; font-weight: bold; }
                </style>
            </head>
            <body>
                ${conteudoHTML}
            </body>
            </html>
        `);
        janela.document.close();
        setTimeout(() => { janela.print(); }, 500);
    },

    gerarOS: (id) => {
        const os = StorageDB.get('ordens').find(o => o.id == id);
        if(!os) return;

        // DADOS DA SUA EMPRESA (Preencha aqui com seus dados reais)
        const empresa = {
            nome: "KA Tech",
            cnpj: "52.177.531/0001-58", // Coloque seu CNPJ
            telefone: "(24) 992046467", // Coloque seu Telefone
            endereco: "" // Coloque seu Endereço
        };

        const valorFormatado = os.valor ? parseFloat(os.valor).toFixed(2).replace('.', ',') : '0,00';
        const dataEntrada = os.entrada ? os.entrada.split('-').reverse().join('/') : '';
        const dataEntrega = os.entrega ? os.entrega.split('-').reverse().join('/') : 'A definir';
        const numeroOS = os.id.toString().padStart(5, '0');
        // Buscar o CPF do cliente na lista de clientes para exibir no PDF
    const listaClientes = StorageDB.get('clientes');
    const dadosClienteAdicionais = listaClientes.find(c => c.nome === os.cliente || c.telefone === os.telefone);
    const cpfCliente = dadosClienteAdicionais && dadosClienteAdicionais.cpf ? dadosClienteAdicionais.cpf : 'Não informado';

        const html = `
            <div class="danfe-container">
                <div class="header-box">
                    <div class="logo-area">
                        <h1>${empresa.nome}</h1>
                    </div>
                    <div class="info-area">
                        <strong style="font-size: 14px;">DOCUMENTO DE ORDEM DE SERVIÇO</strong><br><br>
                        <strong>CNPJ:</strong> ${empresa.cnpj}<br>
                        <strong>Tel / WhatsApp:</strong> ${empresa.telefone}<br>
                        ${empresa.endereco}
                    </div>
                    <div class="os-area">
                        <span style="font-size: 12px; font-weight: bold;">NÚMERO DA OS</span>
                        <span style="font-size: 24px; font-weight: bold;">${numeroOS}</span>
                        <span style="font-size: 12px; margin-top: 5px;">Data: ${dataEntrada}</span>
                    </div>
                </div>

                <div class="section-title">Dados do Cliente</div>
    <div class="box-row">
        <div class="box-field" style="flex: 2;"><span>Nome / Razão Social</span><strong>${os.cliente}</strong></div>
        <div class="box-field"><span>CPF</span><strong>${os.cpf || 'Não informado'}</strong></div>
        <div class="box-field"><span>Telefone</span><strong>${os.telefone}</strong></div>
    </div>

                <div class="section-title">Dados do Equipamento</div>
                <div class="box-row">
                    <div class="box-field"><span>Equipamento</span><strong>${os.equipamento}</strong></div>
                    <div class="box-field"><span>Marca</span><strong>${os.marca}</strong></div>
                    <div class="box-field"><span>Modelo</span><strong>${os.modelo}</strong></div>
                </div>
                <div class="box-row" style="min-height: 40px;">
                    <div class="box-field"><span>Defeito Relatado pelo Cliente</span><strong>${os.defeito}</strong></div>
                </div>

                <div class="section-title">Serviço Realizado e Orçamento</div>
                <div class="box-row" style="min-height: 60px;">
                    <div class="box-field" style="flex: 3;"><span>Descrição do Serviço / Peças Trocadas</span><strong>${os.servico || 'Aguardando avaliação técnica...'}</strong></div>
                    <div class="box-field" style="text-align: right; background-color: #f9f9f9;">
                        <span>Valor Total (R$)</span>
                        <strong style="font-size: 18px; margin-top: 10px;">R$ ${valorFormatado}</strong>
                    </div>
                </div>

                <div class="section-title">Garantia e Status</div>
                <div class="box-row">
                    <div class="box-field"><span>Prazo de Garantia</span><strong>${os.garantia || 'Não especificada'}</strong></div>
                    <div class="box-field"><span>Status Atual</span><strong>${os.status}</strong></div>
                    <div class="box-field"><span>Previsão de Entrega</span><strong>${dataEntrega}</strong></div>
                </div>

                <div class="termo">
                    <strong>TERMO DE RESPONSABILIDADE E GARANTIA:</strong> Declaramos para os devidos fins que o equipamento acima descrito foi recebido/entregue nas condições aqui relatadas. A garantia informada cobre exclusivamente os serviços realizados e as peças substituídas descritas neste documento. Danos ocasionados por mau uso, quedas, exposição a líquidos, picos de energia ou intervenção de técnicos de terceiros acarretarão na perda automática e imediata da garantia. Equipamentos deixados e não retirados no prazo de 90 dias poderão ser vendidos ou descartados para custear despesas de armazenamento, conforme o código de defesa do consumidor.
                </div>
                
                <div class="signatures">
                    <div class="sig-line">${empresa.nome} - Assistência Técnica</div>
                    <div class="sig-line">Assinatura do Cliente</div>
                </div>
            </div>
        `;
        
        PDF.imprimirDocumento(`OS ${numeroOS} - KA Tech`, html);
    }
};