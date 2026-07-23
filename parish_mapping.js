// neighborhood/district -> correct administrative parish (freguesia)
// Format: "<concelho>" -> { "<parish_atual>": "<freguesia_correta>", ... }

const PARISH_CORRECTIONS = {
  'Almada': {
    'Quinta do Ministro': 'Almada',
    'Alto da Ponte': 'Feijó',
    'Chegadinho': 'Feijó',
    'Quinta de Santa Ana': 'Almada',
    'Quinta da Saudade': 'Charneca de Caparica',
    'Quinta da Primavera': 'Charneca de Caparica',
    'Alto do Vale de Rosal': 'Charneca de Caparica',
    'Caranguejais': 'Cova da Piedade',
    'Torcatas': 'Almada',
    'Pombal': 'Almada',
    'Mutela': 'Almada',
    'Almada Velha': 'Almada',
    'Boca do Grilo': 'Costa da Caparica',
    'Marzagão': 'Loures',
    'Vale de Cavalos': 'Charneca de Caparica',
    'Quinta de Santa Rita': 'Charneca de Caparica',
    'Lazarim': 'Charneca de Caparica',
    'Marco Cabaço': 'Charneca de Caparica',
    'Funchalinho': 'Charneca de Caparica',
    'Quinta da Amora': 'Sobreda',
    'Quinta do Texugo': 'Sobreda',
    'Vale Rosal': 'Sobreda',
    'Cotovia': 'Sobreda',
  },
  'Lisboa': {
    'Bairro Alto': 'Misericórdia',
    'Prazeres': 'Estrela',
    'São Paulo': 'Misericórdia',
    'Mercês': 'Misericórdia',
    'Quinta do Lambert': 'Lumiar',
    'Parque das Nações': 'Parque das Nações',
    'Benfica': 'Benfica',
    'Alto do Forte': 'Rio de Mouro',
    'Rio de Mouro Velho': 'Rio de Mouro',
    'Santo António do Estoril': 'Cascais e Estoril',
    'Alto Estoril': 'Cascais e Estoril',
    'Junqueiro': 'Carcavelos e Parede',
    'Fanqueiro': 'Loures',
    'Urbanização das Sapateiras': 'Loures',
    'Urbanização Real Forte': 'Sacavém e Prior Velho',
    'Algueirão': 'Algueirão-Mem Martins',
    'Mem Martins': 'Algueirão-Mem Martins',
    'Alta': 'Coimbra',
    'Santa Cruz': 'Coimbra',
    'Sé Nova': 'Coimbra',
  },
  'Porto': {
    'Ramada Alta': 'Cedofeita',
    'Bouça': 'Cedofeita',
    'Torrinha': 'Cedofeita',
    'Baixa do Porto': 'Cedofeita',
    'Vilar': 'Cedofeita',
    'São Roque': 'Campanhã',
    'Lameira': 'Campanhã',
    'Bela': 'Campanhã',
    'Campo Lindo': 'Paranhos',
    'Agra do Amial': 'Paranhos',
    'Lamas': 'Paranhos',
    'Aval de Cima': 'Paranhos',
    'Santa Marinha': 'Santa Marinha',
    'Laborim': 'Mafamude',
    'Oliveira do Douro': 'Mafamude',
    'Mercado': 'Matosinhos',
    'Bairro dos Pescadores': 'Matosinhos',
    'Basílio Teles': 'Matosinhos',
  },
  'Setúbal': {
    'Fontaínhas': 'Setúbal (São Julião)',
    'Centro Histórico': 'Setúbal (São Julião)',
    'Fonte Nova': 'Setúbal (São Julião)',
    'Bairro Salgado': 'Setúbal (São Julião)',
    'Cavaquinhas': 'Seixal',
    'Bairro dos Corticeiros': 'Amora',
    'Medideira': 'Amora',
  },
  'Aveiro': {
    'Beira Mar': 'Glória e Vera Cruz',
    'Bairro da Gulbenkian': 'Glória e Vera Cruz',
  },
  'Santarém': {
    'Alfange': 'Marvila',
    'Marvila': 'Marvila',
    'Colégio Nuno Álvares': 'Tomar',
  },
  'Braga': {
    'São João do Souto': 'Braga (São Lázaro)',
    'Braga (São Vicente)': 'Braga (São Lázaro)',
    'Sé': 'Braga (São Lázaro)',
    'Peões': 'Nogueiró e Tenões',
    'Vilar': 'Nogueiró e Tenões',
    'Costa': 'Guimarães',
  },
  'Portimão': {
    'Três Bicos': 'Portimão',
    'Praia da Rocha': 'Portimão',
  },
  'Faro': {
    'Vale das Almas': 'Montenegro',
    'Quinta do Eucalipto': 'Montenegro',
    'Horta da Areia': 'Sé e São Pedro',
  },
  'Viana do Castelo': {
    'Meadela': 'Viana do Castelo',
  },
  'Vila Real': {
    'Cabo da Vila': 'Vila Real',
    'Pioledo': 'Vila Real',
    'Boxes': 'Vila Real',
    'Seixo': 'Vila Real',
    'Bairro dos Ferreiros': 'Vila Real',
    'Quinta da Estação': 'Santa Maria Maior',
  },
  'Viseu': {
    'Bairro das Mesuras': 'Viseu',
    'Bairro do Liceu': 'Viseu',
    'Bairro 1° de Maio': 'Viseu',
    'Almacave': 'Lamego',
  },
  'Coimbra': {
    'Celas': 'Santo António dos Olivais',
    'São Sebastião': 'Santo António dos Olivais',
    'Colégio de São Jerónimo': 'Sé Nova',
    'Encosta do Sol': 'Nossa Senhora do Pópulo',
    'Avenal': 'Nossa Senhora do Pópulo',
  },
  'Leiria': {
    'Bairro dos Sargentos': 'Leiria, Pousos, Barreira e Cortes',
    'Bairro dos Anjos': 'Leiria, Pousos, Barreira e Cortes',
  },
  'Portalegre': {
    'Centro Histórico de Elvas': 'Assunção',
    'Bairro da Boa-Fé': 'Assunção',
    'Bairro das Caxias': 'Assunção',
    'São Lourenço': 'Sé e São Lourenço',
    'Sé': 'Sé e São Lourenço',
  },
  'Castelo Branco': {
    'Bairro do Barrocal': 'Castelo Branco',
    'Bairro da Alegria': 'Covilhã',
    'Biquinha': 'Covilhã',
    'Nossa Senhora da Conceição': 'Covilhã',
  },
  'Guarda': {
    'Judiária': 'Guarda',
  },
  'Évora': {
    'Horta do Bispo': 'Évora',
    'Quinta das Tâmaras': 'Évora',
    'Santo André': 'Estremoz',
  },
  'Faro': {
    'Vilamoura': 'Quarteira',
  },
};

// Also normalize parishes that are equal to the municipality name
// (these are EV stations with no specific parish data)

function normalizeParish(municipality, currentParish, district) {
  // Check direct mapping
  if (PARISH_CORRECTIONS[municipality] && PARISH_CORRECTIONS[municipality][currentParish]) {
    return PARISH_CORRECTIONS[municipality][currentParish];
  }
  
  // EV stations often have parish == municipality (generic fallback)
  // Keep as-is
  return currentParish;
}

module.exports = { normalizeParish, PARISH_CORRECTIONS };
