export default function handler(req, res) {
  const q = req.query;

  const salarioBaseOriginal = parseFloat(q.salarioBase);
  const faltas = parseInt(q.faltas);
  const descontoFaltas = salarioBaseOriginal * 0.066 * faltas;
  const salarioBase = salarioBaseOriginal - descontoFaltas;

  const premiacoes = parseFloat(q.premiacao);
  const horasExtras = parseFloat(q.horasExtras);
  const pensao = parseFloat(q.pensao);
  const dependentesIR = parseInt(q.dependentesIR);
  const planoSaude = q.planoSaude.toUpperCase() === "S";
  const planoOdonto = q.planoOdonto.toUpperCase() === "S";
  const adiantamento = q.adiantamento.toUpperCase() === "S";
  const depSaude = parseInt(q.depSaude);
  const depOdonto = parseInt(q.depOdonto);
  const descontoFarmacia = parseFloat(q.farmacia);
  const descontoTicketPlus = parseFloat(q.ticketPlus);
  const descontoOtica = parseFloat(q.otica);
  const parcelaEconsig = parseFloat(q.parcelaConsig);

  function calcularINSS(salario) {
    if (salario <= 1518.00) return salario * 0.075;
    else if (salario <= 2793.88) return salario * 0.09 - 22.77;
    else if (salario <= 4190.83) return salario * 0.12 - 106.59;
    else return salario * 0.14 - 190.40;
  }

  function calcularIRRF(base) {
    if (base <= 2259.20) return 0;
    else if (base <= 2826.65) return base * 0.075 - 169.44;
    else if (base <= 3751.05) return base * 0.15 - 381.44;
    else if (base <= 4664.68) return base * 0.225 - 662.77;
    else return base * 0.275 - 896.00;
  }

  const inss = calcularINSS(salarioBase);
  const baseIRRF = salarioBase - inss - (dependentesIR * 189.59);
  const irrf = calcularIRRF(baseIRRF);
  const baseMargem = salarioBase - inss - irrf - pensao;
  const margemConsignavel = baseMargem * 0.35;
  const proventos = salarioBase + premiacoes + horasExtras;

  let descontos = [];

  if (descontoFaltas > 0) descontos.push(descontoFaltas);
  if (planoSaude) descontos.push(36.08);
  if (depSaude > 0) descontos.push(depSaude * 120.27);
  if (planoOdonto && depOdonto > 0) descontos.push(depOdonto * 14.93);
  if (pensao > 0) descontos.push(pensao);
  if (parcelaEconsig > 0) descontos.push(parcelaEconsig);
  if (descontoFarmacia > 0) descontos.push(descontoFarmacia);
  if (descontoTicketPlus > 0) descontos.push(descontoTicketPlus);
  if (descontoOtica > 0) descontos.push(descontoOtica);
  if (adiantamento) descontos.push(salarioBase * 0.4);
  descontos.push(inss);
  if (irrf > 0) descontos.push(irrf);

  const totalDescontos = descontos.reduce((acc, d) => acc + d, 0);
  const liquido = proventos - totalDescontos;
  const minimoLiquido = salarioBaseOriginal * 0.3;
  const adiantamentoPermitido = liquido >= minimoLiquido;
  const parcelaOk = parcelaEconsig <= margemConsignavel;

  res.setHeader("Content-Type", "application/json");
  res.status(200).json({
    parcelaDentroDaMargem: parcelaOk,
    adiantamentoPermitido,
    salarioLiquido: liquido.toFixed(2),
    mensagem:
      `Parcela ${parcelaOk ? "dentro" : "fora"} da margem. ` +
      `Adiantamento ${adiantamentoPermitido ? "mantido" : "suspenso"}.`
  });
}
