'use strict';

let listaDeTodosPokemons = [];

const state = {
  teamSlots: Array.from({ length: 6 }, () => ({ pokemon: null, moves: [null, null, null, null] })),
  selectedTeamSlotIndex: null,
  selectedMovesPokemonIndex: null,
};

const TYPE_LIST = [
  'normal','fire','water','electric','grass','ice','fighting','poison','ground','flying','psychic','bug','rock','ghost','dragon','dark','steel','fairy'
];

// Tabela de efetividade de tipos (ataque -> defesa)
const TYPE_CHART = {
  normal:   { rock: 0.5, ghost: 0, steel: 0.5 },
  fire:     { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water:    { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass:    { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice:      { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, rock: 2, dark: 2, steel: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, ghost: 0, fairy: 0.5 },
  poison:   { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground:   { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying:   { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic:  { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug:      { fire: 0.5, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5, grass: 2 },
  rock:     { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost:    { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon:   { dragon: 2, steel: 0.5, fairy: 0 },
  dark:     { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel:    { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, fairy: 2, steel: 0.5 },
  fairy:    { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};

function getMultiplier(attackType, defendType) {
  const row = TYPE_CHART[attackType] || {};
  const m = row[defendType];
  if (m === undefined) return 1;
  return m;
}

function capitalize(text) {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function getPokemonTypes(pokemon) {
  if (!pokemon || !pokemon.types) return [];
  return pokemon.types
    .sort((a, b) => a.slot - b.slot)
    .map(t => t.type.name);
}

function computeDefensiveMatchups(pokemonTypes) {
  const result = { weaknesses: [], resistances: [], immunities: [] };
  TYPE_LIST.forEach(attackType => {
    const multiplier = pokemonTypes.reduce((acc, defType) => acc * getMultiplier(attackType, defType), 1);
    if (multiplier === 0) {
      result.immunities.push(`${capitalize(attackType)} (0x)`);
    } else if (multiplier > 1) {
      result.weaknesses.push(`${capitalize(attackType)} (${multiplier}x)`);
    } else if (multiplier < 1) {
      result.resistances.push(`${capitalize(attackType)} (${multiplier}x)`);
    }
  });
  return result;
}

function computeOffensiveMatchups(pokemonTypes) {
  const strengths = new Set();
  const weaknesses = new Set();
  TYPE_LIST.forEach(defType => {
    const multipliers = pokemonTypes.map(atkType => getMultiplier(atkType, defType));
    const maxM = multipliers.length ? Math.max(...multipliers) : 1;
    const minM = multipliers.length ? Math.min(...multipliers) : 1;
    if (maxM > 1) strengths.add(capitalize(defType));
    const allNotEffective = multipliers.length > 0 && multipliers.every(m => m === 0 || m <= 0.5);
    if (allNotEffective) weaknesses.add(capitalize(defType));
  });
  return { strengths: Array.from(strengths), weaknesses: Array.from(weaknesses) };
}

function limparElemento(elemento) {
  if (!elemento) return;
  while (elemento.firstChild) elemento.removeChild(elemento.firstChild);
}

function criarModal(id, titulo) {
  const existente = document.getElementById(id);
  const overlayExistente = document.querySelector('.modal-overlay');
  if (existente) existente.remove();
  if (overlayExistente) overlayExistente.remove();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.id = id;
  modal.className = 'modal-content';

  const modalHeader = document.createElement('div');
  modalHeader.className = 'modal-header';
  const tituloEl = document.createElement('h2');
  tituloEl.textContent = titulo;
  const botaoFechar = document.createElement('button');
  botaoFechar.className = 'close-button';
  botaoFechar.textContent = '×';
  modalHeader.appendChild(tituloEl);
  modalHeader.appendChild(botaoFechar);

  const modalBody = document.createElement('div');
  modalBody.className = 'modal-body';

  modal.appendChild(modalHeader);
  modal.appendChild(modalBody);
  document.body.appendChild(overlay);
  document.body.appendChild(modal);

  const fechar = () => {
    modal.remove();
    overlay.remove();
  };
  overlay.addEventListener('click', fechar);
  botaoFechar.addEventListener('click', fechar);

  return { modal, overlay, modalBody, close: fechar };
}

function abrirModalDeSelecaoPokemon(onSelect) {
  const { modalBody, close } = criarModal('modal-pokemons', 'Escolha um Pokémon');
  const barraDeBusca = document.createElement('input');
  barraDeBusca.type = 'text';
  barraDeBusca.className = 'search-bar';
  barraDeBusca.placeholder = 'Buscar Pokémon...';
  const listaContainer = document.createElement('div');
  listaContainer.className = 'pokemon-list';
  modalBody.appendChild(barraDeBusca);
  modalBody.appendChild(listaContainer);

  function renderLista(base) {
    limparElemento(listaContainer);
    if (!base || base.length === 0) {
      const vazio = document.createElement('p');
      vazio.textContent = 'Nenhum Pokémon encontrado.';
      listaContainer.appendChild(vazio);
      return;
    }
    const fragmento = document.createDocumentFragment();
    base.forEach(pokemon => {
      const item = document.createElement('div');
      item.className = 'pokemon-list-item';
      const imagem = document.createElement('img');
      imagem.src = (pokemon.sprites && (pokemon.sprites.front_default || pokemon.sprites.other?.['official-artwork']?.front_default)) || './img/pokeball-fundo.png';
      imagem.alt = pokemon.name;
      imagem.loading = 'lazy';
      const nome = document.createElement('span');
      nome.textContent = pokemon.name;
      item.appendChild(imagem);
      item.appendChild(nome);
      item.addEventListener('click', () => { onSelect(pokemon); close(); });
      fragmento.appendChild(item);
    });
    listaContainer.appendChild(fragmento);
  }

  barraDeBusca.addEventListener('input', (e) => {
    const termo = String(e.target.value || '').trim().toLowerCase();
    const filtrados = listaDeTodosPokemons.filter(p => p.name.toLowerCase().includes(termo));
    renderLista(filtrados);
  });

  renderLista(listaDeTodosPokemons);
}

function abrirModalDeMoves(moves, onSelect) {
  const { modalBody, close } = criarModal('modal-moves', 'Escolha um Move');
  const barraDeBusca = document.createElement('input');
  barraDeBusca.type = 'text';
  barraDeBusca.className = 'search-bar';
  barraDeBusca.placeholder = 'Buscar Move...';
  const listaContainer = document.createElement('div');
  listaContainer.className = 'pokemon-list';
  modalBody.appendChild(barraDeBusca);
  modalBody.appendChild(listaContainer);

  function renderLista(base) {
    limparElemento(listaContainer);
    if (!base || base.length === 0) {
      const vazio = document.createElement('p');
      vazio.textContent = 'Nenhum move encontrado.';
      listaContainer.appendChild(vazio);
      return;
    }
    const fragmento = document.createDocumentFragment();
    base.forEach(move => {
      const item = document.createElement('div');
      item.className = 'pokemon-list-item';
      const nome = document.createElement('span');
      nome.textContent = move.name;
      item.appendChild(nome);
      item.addEventListener('click', async () => {
        try {
          const res = await fetch(move.url);
          const detalhes = await res.json();
          const selecionado = {
            name: detalhes.name,
            type: detalhes.type?.name || 'unknown',
            power: detalhes.power,
            accuracy: detalhes.accuracy,
            pp: detalhes.pp,
            damage_class: detalhes.damage_class?.name || 'status',
          };
          onSelect(selecionado);
          close();
        } catch (e) {
          console.error('Falha ao buscar move:', e);
          alert('Falha ao carregar detalhes do move. Tente novamente.');
        }
      });
      fragmento.appendChild(item);
    });
    listaContainer.appendChild(fragmento);
  }

  barraDeBusca.addEventListener('input', (e) => {
    const termo = String(e.target.value || '').trim().toLowerCase();
    const filtrados = moves.filter(m => m.name.toLowerCase().includes(termo));
    renderLista(filtrados);
  });

  renderLista(moves);
}

function setTeamSlotPokemon(slotIndex, pokemon) {
  if (slotIndex == null) return;
  const slot = state.teamSlots[slotIndex];
  slot.pokemon = pokemon;
  slot.moves = [null, null, null, null];
  if (state.selectedMovesPokemonIndex == null) state.selectedMovesPokemonIndex = slotIndex;
  renderCard(slotIndex);
  renderTeamSidebar();
  renderTeamStatusTable();
  updateMoveSlotsUI();
}

function renderCard(slotIndex) {
  const cards = document.querySelectorAll('.card-pokemon');
  const card = cards[slotIndex];
  if (!card) return;
  const img = card.querySelector('img');
  const p = card.querySelector('p');
  const slot = state.teamSlots[slotIndex];
  if (slot.pokemon) {
    const sprite = (slot.pokemon.sprites && (slot.pokemon.sprites.front_default || slot.pokemon.sprites.other?.['official-artwork']?.front_default)) || './img/pokeball-fundo.png';
    img.src = sprite;
    img.alt = slot.pokemon.name;
    p.textContent = slot.pokemon.name;
  } else {
    img.src = './img/vector-adicionar.svg';
    img.alt = '';
    p.textContent = 'Adicionar pokemon';
  }
}

function renderAllCards() {
  for (let i = 0; i < state.teamSlots.length; i++) {
    renderCard(i);
  }
}

function renderTeamSidebar() {
  const container = document.querySelector('#move-set .time-escolhido .time');
  if (!container) return;
  limparElemento(container);
  state.teamSlots.forEach((slot, index) => {
    if (!slot.pokemon) return;
    const item = document.createElement('div');
    item.className = 'pokemon-lista';
    item.dataset.index = String(index);
    const img = document.createElement('img');
    img.src = (slot.pokemon.sprites && (slot.pokemon.sprites.front_default || slot.pokemon.sprites.other?.['official-artwork']?.front_default)) || './img/pokeball-fundo.png';
    img.alt = slot.pokemon.name;
    const span = document.createElement('span');
    span.textContent = capitalize(slot.pokemon.name);
    const tiposDiv = document.createElement('div');
    tiposDiv.className = 'tipos';
    getPokemonTypes(slot.pokemon).forEach(t => {
      const tp = document.createElement('div');
      tp.className = 'tipo-pokemon';
      const p = document.createElement('p');
      p.textContent = capitalize(t);
      tp.appendChild(p);
      tiposDiv.appendChild(tp);
    });
    item.appendChild(img);
    item.appendChild(span);
    item.appendChild(tiposDiv);
    item.addEventListener('click', () => {
      state.selectedMovesPokemonIndex = index;
      updateMoveSlotsUI();
    });
    container.appendChild(item);
  });
}

function renderTeamStatusTable() {
  const table = document.querySelector('.status-time table');
  if (!table) return;
  const headerHTML = `
    <tr>
      <td>Pokemon</td>
      <td>Tipos</td>
      <td>Força (Atacando)</td>
      <td>Fraquezas (Atacando)</td>
      <td>Resistencias (Defendendo)</td>
      <td>Fraquezas (Defendendo)</td>
      <td>Imunidades (Defendendo)</td>
    </tr>
  `;
  const rows = state.teamSlots.map(slot => {
    if (!slot.pokemon) return '';
    const types = getPokemonTypes(slot.pokemon);
    const def = computeDefensiveMatchups(types);
    const off = computeOffensiveMatchups(types);
    const sprite = (slot.pokemon.sprites && (slot.pokemon.sprites.front_default || slot.pokemon.sprites.other?.['official-artwork']?.front_default)) || './img/pokeball-fundo.png';
    return `
      <tr>
        <td><img src="${sprite}" alt="${slot.pokemon.name}" /></td>
        <td>${types.map(capitalize).join(', ') || '-'}</td>
        <td>${off.strengths.join(', ') || '-'}</td>
        <td>${off.weaknesses.join(', ') || '-'}</td>
        <td>${def.resistances.join(', ') || '-'}</td>
        <td>${def.weaknesses.join(', ') || '-'}</td>
        <td>${def.immunities.join(', ') || '-'}</td>
      </tr>
    `;
  }).join('');
  table.innerHTML = headerHTML + rows;
}

function updateMoveSlotsUI() {
  const container = document.querySelector('.move-set-pokemon .moves');
  if (!container) return;
  const slotIndex = state.selectedMovesPokemonIndex;
  const slots = Array.from(container.querySelectorAll('.move'));
  if (slotIndex == null || !state.teamSlots[slotIndex].pokemon) {
    slots.forEach(s => {
      const span = s.querySelector('span');
      if (span) span.textContent = 'Selecione um Pokémon no time';
    });
    return;
  }
  const moves = state.teamSlots[slotIndex].moves;
  slots.forEach((s, i) => {
    const span = s.querySelector('span');
    const mv = moves[i];
    if (!mv) {
      span.textContent = 'Clique para escolher um movimento';
    } else {
      const extra = [];
      if (mv.type) extra.push(capitalize(mv.type));
      if (mv.power != null) extra.push(`Pwr ${mv.power}`);
      if (mv.accuracy != null) extra.push(`Acc ${mv.accuracy}`);
      span.textContent = `${mv.name} ${extra.length ? '(' + extra.join(', ') + ')' : ''}`;
    }
  });
}

function inicializarCards() {
  const cards = document.querySelectorAll('.card-pokemon');
  cards.forEach((card, index) => {
    card.dataset.slotIndex = String(index);
    card.addEventListener('click', () => {
      state.selectedTeamSlotIndex = index;
      if (!listaDeTodosPokemons || listaDeTodosPokemons.length === 0) {
        alert('Aguarde, os Pokémon ainda estão sendo carregados!');
        return;
      }
      abrirModalDeSelecaoPokemon((pokemon) => setTeamSlotPokemon(index, pokemon));
    });
  });
}

function inicializarMoveSlots() {
  const slots = document.querySelectorAll('.move-set-pokemon .moves .move');
  slots.forEach((el, idx) => {
    el.dataset.moveIndex = String(idx);
    el.addEventListener('click', () => {
      const teamIdx = state.selectedMovesPokemonIndex;
      if (teamIdx == null || !state.teamSlots[teamIdx].pokemon) {
        alert('Selecione um Pokémon na lista do time para escolher os moves.');
        return;
      }
      const pokemon = state.teamSlots[teamIdx].pokemon;
      const movesDisponiveis = (pokemon.moves || []).map(m => m.move);
      if (!movesDisponiveis || movesDisponiveis.length === 0) {
        alert('Este Pokémon não possui moves listados.');
        return;
      }
      abrirModalDeMoves(movesDisponiveis, (moveSelecionado) => {
        state.teamSlots[teamIdx].moves[idx] = moveSelecionado;
        updateMoveSlotsUI();
      });
    });
  });
}

function inicializarSincronizacaoNomeDoTime() {
  const input = document.querySelector('#team-builder .nome-time input');
  const destino = document.querySelector('#move-set .time-name p');
  if (input && destino) {
    const sync = () => destino.textContent = input.value.trim() || 'Time 1';
    input.addEventListener('input', sync);
    sync();
  }
}

async function initApp() {
  await buscarTodosPokemons();
  inicializarCards();
  inicializarMoveSlots();
  inicializarSincronizacaoNomeDoTime();
  renderAllCards();
  renderTeamSidebar();
  renderTeamStatusTable();
  updateMoveSlotsUI();
}



async function buscarTodosPokemons() {
  console.log('Buscando a lista de Pokémon...');
  const overlayCarregando = criarOverlayDeCarregamento();
  try {
    const respostaLista = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1025');
    const listaInicial = await respostaLista.json();
    const promessasDeDetalhes = listaInicial.results.map(pokemon => fetch(pokemon.url).then(res => res.json()));
    listaDeTodosPokemons = await Promise.all(promessasDeDetalhes);
    console.log('Todos os Pokémon foram carregados!');
    return listaDeTodosPokemons;
  } catch (error) {
    console.error('Falha ao buscar Pokémon:', error);
    alert('Não foi possível carregar os dados dos Pokémon. Verifique sua conexão ou tente novamente mais tarde.');
  } finally {
    overlayCarregando.remove();
  }
  return listaDeTodosPokemons;
}

function criarOverlayDeCarregamento() {
  const overlay = document.createElement('div');
  overlay.className = 'loading-overlay';
  const spinner = document.createElement('div');
  spinner.className = 'spinner';
  const texto = document.createElement('p');
  texto.textContent = 'Carregando Pokédex...';
  overlay.appendChild(spinner);
  overlay.appendChild(texto);
  document.body.appendChild(overlay);
  return overlay;
}

// (substituída por versão funcional acima)


// (substituída por versão funcional acima)

//     const modalExistente = document.getElementById('modal-pokemons')
//     if (modalExistente) modalExistente.remove()

//     const overlay = document.createElement('div')
//     overlay.className = 'modal-overlay'

//     const modal = document.createElement('div')
//     modal.id = 'modal-pokemons'
//     modal.className = 'modal-content'


//     const modalHeader = document.createElement('div')
//     modalHeader.className = 'modal-header'
//     const titulo = document.createElement('h2')
//     titulo.textContent = 'Escolha um Pokémon'
//     const botaoFechar = document.createElement('button')
//     botaoFechar.className = 'close-button'
//     botaoFechar.textContent = '×'
//     modalHeader.appendChild(titulo)
//     modalHeader.appendChild(botaoFechar)


//     const modalBody = document.createElement('div')
//     modalBody.className = 'modal-body'
//     const barraDeBusca = document.createElement('input')
//     barraDeBusca.type = 'text'
//     barraDeBusca.className = 'search-bar'
//     barraDeBusca.placeholder = 'Buscar Pokémon...'
//     const listaContainer = document.createElement('div')
//     listaContainer.className = 'pokemon-list'
//     modalBody.appendChild(barraDeBusca)
//     modalBody.appendChild(listaContainer)


//     modal.appendChild(modalHeader)
//     modal.appendChild(modalBody)
//     document.body.appendChild(overlay)
//     document.body.appendChild(modal)

//     const fecharModal = () => {
//         modal.remove()
//         overlay.remove()
//     };

//     overlay.addEventListener('click', fecharModal)
//     botaoFechar.addEventListener('click', fecharModal)


//     popularListaPokemon()
//     ativarBuscaPokemon()
// }


// (substituída por renderLista local nos modais)
    
    
//     const containerLista = document.querySelector('.pokemon-list')
//     if (!containerLista) 
//         return limparElemento(containerLista)

//     if (lista.length === 0) {
//         const mensagemVazio = document.createElement('p');
//         mensagemVazio.textContent = 'Nenhum Pokémon encontrado.'
//         containerLista.appendChild(mensagemVazio);
//         return
//     }
//     const fragmento = document.createDocumentFragment()

//     lista.forEach(pokemon => {
//         const item = document.createElement('div')
//         item.className = 'pokemon-list-item'

        
//         const imagem = document.createElement('img')
//         imagem.src = pokemon.sprites.front_default || './img/pokeball-fundo.png'
//         imagem.alt = pokemon.name;
//         imagem.loading = 'lazy';

//         const nome = document.createElement('span');
//         nome.textContent = pokemon.name;

//         item.appendChild(imagem);
//         item.appendChild(nome);
//         item.addEventListener('click', () => selecionarPokemon(pokemon))
//         fragmento.appendChild(item)
//     })

//     containerLista.appendChild(fragmento)
// }


// (substituída por listeners locais nos modais)
//     const inputBusca = document.querySelector('.search-bar');
//     if (!inputBusca) return;

//     inputBusca.addEventListener('input', (evento) => {
//         const termoBuscado = evento.target.value.toLowerCase();
//         const pokemonsFiltradros = listaDeTodosPokemons.filter(pokemon => {
//             return pokemon.name.toLowerCase().includes(termoBuscado);
//         });
//         popularListaPokemon(pokemonsFiltradros);
//     });
// }


// (substituída por setTeamSlotPokemon)
//     if (cardClicado) {
//         const imgDoCard = cardClicado.querySelector('img');
//         const pDoCard = cardClicado.querySelector('p');
//         imgDoCard.src = pokemon.sprites.front_default;
//         pDoCard.textContent = pokemon.name;


//         cardClicado.dataset.pokemonId = pokemon.id;
//     }

//     const modal = document.getElementById('modal-pokemons');
//     const overlay = document.querySelector('.modal-overlay');
//     if (modal) modal.remove();
//     if (overlay) overlay.remove();
// }

// (substituída por versão funcional acima)
//     const cards = document.querySelectorAll('.card-pokemon');
//     cards.forEach(card => {
//         card.addEventListener('click', () => {
//             cardClicado = card;
//             if (listaDeTodosPokemons.length > 0) {
//                 abrirModalDeSelecao();
//             } else {
//                 alert("Aguarde, os Pokémon ainda estão sendo carregados!");
//             }
//         })
//     })
// }



document.addEventListener('DOMContentLoaded', async () => {
  await initApp();
});
