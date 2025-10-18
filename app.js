'use strict';

let cardClicado = null


async function buscarTodosPokemons() {
    console.log('Buscando a lista de Pokémon...')

    const overlayCarregando = criarOverlayDeCarregamento()
    try {
        const respostaLista = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1025')

        const listaInicial = await respostaLista.json()

        const promessasDeDetalhes = listaInicial.results.map(pokemon => fetch(pokemon.url).then(res => res.json()))

        const listaCompleta = await Promise.all(promessasDeDetalhes)

        console.log('Todos os Pokémon foram carregados!')

        return listaCompleta

    } catch (error) {
        console.error("Falha ao buscar Pokémon:", error)
        alert("Não foi possível carregar os dados dos Pokémon. Verifique sua conexão ou tente novamente mais tarde.")
        return []
    } finally {

        overlayCarregando.remove()
    }
}

function criarOverlayDeCarregamento() {
    const overlay = document.createElement('div')
    overlay.className = 'loading-overlay'

    const spinner = document.createElement('div')
    spinner.className = 'spinner'

    const texto = document.createElement('p')
    texto.textContent = 'Carregando Pokédex...'

    overlay.appendChild(spinner)
    overlay.appendChild(texto)

    document.body.appendChild(overlay)
    return overlay;
}


async function inicializarCards() {
    const cards = document.querySelectorAll('.card-pokemon')


    const listaDeTodosPokemons = await iniciarApp()

    cards.forEach(card => {
        card.addEventListener('click', () => {

            cardClicado = card
            if (listaDeTodosPokemons) {
                console.log(listaDeTodosPokemons)
                const pokemons = listaDeTodosPokemons.pokemons
                abrirModalSelecao(pokemons)
            } else {
                alert("Aguarde, os Pokémon ainda estão sendo carregados!")
            }
        });
    });
}


function abrirModalSelecao(listaDePokemons) {

    const modalFundo = document.createElement('div')
    modalFundo.classList.add('modal-fundo')

    const modalContainer = document.createElement('div')
    modalContainer.classList.add('modal-container')


    const barraDeBusca = document.createElement('input')
    barraDeBusca.type = 'search'
    barraDeBusca.placeholder = 'Pesquisar Pokémon...'
    barraDeBusca.classList.add('modal-barra-busca')


    const cardsWrapper = document.createElement('div')
    cardsWrapper.classList.add('modal-cards-wrapper')

    listaDePokemons.forEach(pokemon => {
        const cardDoPokemon = criarCardParaModal(pokemon)
        cardsWrapper.appendChild(cardDoPokemon)
    })


    barraDeBusca.addEventListener('input', () => {

        const termoBusca = barraDeBusca.value.toLowerCase()


        const todosOsCards = cardsWrapper.querySelectorAll('.pokemon-modal')

        todosOsCards.forEach(card => {

            const nomePokemon = card.dataset.nome


            if (nomePokemon.includes(termoBusca)) {
                card.style.display = 'block'
            } else {
                card.style.display = 'none'
            }
        })
    })


    modalContainer.appendChild(barraDeBusca)
    modalContainer.appendChild(cardsWrapper)
    modalFundo.appendChild(modalContainer)
    document.body.appendChild(modalFundo)


    modalFundo.addEventListener('click', (e) => {
        if (e.target === modalFundo) {
            modalFundo.remove()
        }
    })
}

function criarCardParaModal(pokemon) {
    const cardPokemon = document.createElement('div')
    cardPokemon.classList.add('pokemon-modal')

    cardPokemon.dataset.nome = pokemon.name.toLowerCase()

    const pokemonImg = document.createElement('img')
    pokemonImg.classList.add('img-pokemon-modal')


    pokemonImg.src = pokemon.sprites?.front_default || 'url_da_sua_imagem_padrao.png'


    pokemonImg.alt = pokemon.name

    const pokemonNome = document.createElement('p')
    pokemonNome.textContent = pokemon.name

    cardPokemon.appendChild(pokemonImg)
    cardPokemon.appendChild(pokemonNome)

    cardPokemon.addEventListener('click', () => {
        selecionarPokemonParaTime(pokemon)
        const modalFundo = document.querySelector('.modal-fundo')
        if (modalFundo) {
            modalFundo.remove()
        }
    })

    return cardPokemon
}


function selecionarPokemonParaTime(pokemon) {
    console.log(`${pokemon.name} foi selecionado para o card:`, cardClicado)
    console.log(`Função 'selecionarPokemonParaTime' chamada com: ${pokemon.name}`)
    console.log('O card do time (cardClicado) que deve ser atualizado é:', cardClicado)

    if (cardClicado) {

        const imgDoCard = cardClicado.querySelector('.pokemonTime')
        const nomeDoCard = cardClicado.querySelector('.nomePokemonTime')

        if (imgDoCard) imgDoCard.src = pokemon.sprites.front_default
        if (nomeDoCard) nomeDoCard.textContent = pokemon.name
    }
}


document.addEventListener('DOMContentLoaded', async () => {

    await inicializarCards()
})

async function iniciarApp() {
    const listaDePokemons = await buscarTodosPokemons();

    let jsonPokemos = {
        autor: "Gabryel Fillipe",
        versao: "1.0",
        data: new Date(),
        pokemons: listaDePokemons
    }
    return jsonPokemos
}