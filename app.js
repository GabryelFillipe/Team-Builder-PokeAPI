'use strict';

let listaDeTodosPokemons = [];

let cardClicado = null;

async function buscarTodosPokemons() {
    console.log('Buscando a lista de Pokémon...');

    const overlayCarregando = criarOverlayDeCarregamento();
    try {
        const respostaLista = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1025');
        const listaInicial = await respostaLista.json();


        const promessasDeDetalhes = listaInicial.results.map(pokemon => fetch(pokemon.url).then(res => res.json()));
        listaDeTodosPokemons = await Promise.all(promessasDeDetalhes);

        console.log('Todos os Pokémon foram carregados!');
        
    } catch (error) {
        console.error("Falha ao buscar Pokémon:", error);
        alert("Não foi possível carregar os dados dos Pokémon. Verifique sua conexão ou tente novamente mais tarde.");
    } finally {

        overlayCarregando.remove();
    }
}

function limparElemento(elemento) {
    while (elemento.firstChild) {
        elemento.removeChild(elemento.firstChild);
    }
}


function abrirModalDeSelecao() {

    const modalExistente = document.getElementById('modal-pokemons');
    if (modalExistente) modalExistente.remove();


    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const modal = document.createElement('div');
    modal.id = 'modal-pokemons';
    modal.className = 'modal-content';


    const modalHeader = document.createElement('div');
    modalHeader.className = 'modal-header';
    const titulo = document.createElement('h2');
    titulo.textContent = 'Escolha um Pokémon';
    const botaoFechar = document.createElement('button');
    botaoFechar.className = 'close-button';
    botaoFechar.textContent = '×';
    modalHeader.appendChild(titulo);
    modalHeader.appendChild(botaoFechar);


    const modalBody = document.createElement('div');
    modalBody.className = 'modal-body';
    const barraDeBusca = document.createElement('input');
    barraDeBusca.type = 'text';
    barraDeBusca.className = 'search-bar';
    barraDeBusca.placeholder = 'Buscar Pokémon...';
    const listaContainer = document.createElement('div');
    listaContainer.className = 'pokemon-list';
    modalBody.appendChild(barraDeBusca);
    modalBody.appendChild(listaContainer);


    modal.appendChild(modalHeader);
    modal.appendChild(modalBody);
    document.body.appendChild(overlay);
    document.body.appendChild(modal);

    const fecharModal = () => {
        modal.remove();
        overlay.remove();
    };

    overlay.addEventListener('click', fecharModal);
    botaoFechar.addEventListener('click', fecharModal);


    popularListaPokemon();
    ativarBuscaPokemon();
}


function popularListaPokemon(lista = listaDeTodosPokemons) {
    const containerLista = document.querySelector('.pokemon-list');
    if (!containerLista) return;

    limparElemento(containerLista);

    if (lista.length === 0) {
        const mensagemVazio = document.createElement('p');
        mensagemVazio.textContent = 'Nenhum Pokémon encontrado.';
        containerLista.appendChild(mensagemVazio);
        return;
    }

    const fragmento = document.createDocumentFragment();

    lista.forEach(pokemon => {
        const item = document.createElement('div');
        item.className = 'pokemon-list-item';

        const imagem = document.createElement('img');
        imagem.src = pokemon.sprites.front_default || './img/pokeball-fundo.png';
        imagem.alt = pokemon.name;
        imagem.loading = 'lazy';

        const nome = document.createElement('span');
        nome.textContent = pokemon.name;

        item.appendChild(imagem);
        item.appendChild(nome);
        item.addEventListener('click', () => selecionarPokemon(pokemon));
        fragmento.appendChild(item);
    });

    containerLista.appendChild(fragmento);
}


function ativarBuscaPokemon() {
    const inputBusca = document.querySelector('.search-bar');
    if (!inputBusca) return;

    inputBusca.addEventListener('input', (evento) => {
        const termoBuscado = evento.target.value.toLowerCase();
        const pokemonsFiltradros = listaDeTodosPokemons.filter(pokemon => {
            return pokemon.name.toLowerCase().includes(termoBuscado);
        });
        popularListaPokemon(pokemonsFiltradros);
    });
}


function selecionarPokemon(pokemon) {
    if (cardClicado) {
        const imgDoCard = cardClicado.querySelector('img');
        const pDoCard = cardClicado.querySelector('p');
        imgDoCard.src = pokemon.sprites.front_default;
        pDoCard.textContent = pokemon.name;


        cardClicado.dataset.pokemonId = pokemon.id;
    }

    const modal = document.getElementById('modal-pokemons');
    const overlay = document.querySelector('.modal-overlay');
    if (modal) modal.remove();
    if (overlay) overlay.remove();
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




function inicializarCards() {
    const cards = document.querySelectorAll('.card-pokemon');
    cards.forEach(card => {
        card.addEventListener('click', () => {
            cardClicado = card;
            if (listaDeTodosPokemons.length > 0) {
                abrirModalDeSelecao();
            } else {
                alert("Aguarde, os Pokémon ainda estão sendo carregados!");
            }
        });
    });
}


document.addEventListener('DOMContentLoaded', async () => {
    inicializarCards();
    await buscarTodosPokemons();
});

