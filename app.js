'use strict';

let cardClicado = null
let slotMoveSetAtivo = null
let slotDeMoveAtivo = null

// Função para buscar todos os pokemons registrados na PokeAPI
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

// Função para criar um efeito de carregamento enquanto carrega a lista de pokemons
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

// Função responsavel por iniciar os cards antes de monstar o time
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

//Função responsavel por abrir e criar o modal com os pokemons a serem escolhidos
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

// Função responsavel por criar os cards dos pokemons que iram para o modal de pokemons
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

    const tiposElemento = criarTiposPokemon(pokemon.types)

    cardPokemon.appendChild(pokemonImg)
    cardPokemon.appendChild(pokemonNome)
    cardPokemon.appendChild(tiposElemento)

    cardPokemon.addEventListener('click', async () => {
        await selecionarPokemonParaTime(pokemon)
        const modalFundo = document.querySelector('.modal-fundo')
        if (modalFundo) {
            modalFundo.remove()
        }
    })

    return cardPokemon
}

// Função responsavel por buscar o tipo de um pokemon
function criarTiposPokemon(tiposArray) {
    const tiposContainer = document.createElement('div')
    tiposContainer.classList.add('modal-tipos')

    tiposArray.forEach(tipoInfo => {
        const nomeTipo = document.createElement('span')
        nomeTipo.textContent = tipoInfo.type.name


        nomeTipo.classList.add('modal-tipo-tag')
        nomeTipo.classList.add(`tipo-${tipoInfo.type.name}`)

        tiposContainer.appendChild(nomeTipo)
    })

    return tiposContainer
}

function criarTagsDeTipoPorNome(arrayDeNomes) {
    const container = document.createElement('div')

    if (!arrayDeNomes || arrayDeNomes.length === 0 || arrayDeNomes[0] === 'N/A') {
        container.textContent = 'N/A'
        return container
    }

    arrayDeNomes.forEach(nome => {
        const spanTag = document.createElement('span')
        spanTag.textContent = nome
        spanTag.classList.add('modal-tipo-tag')
        spanTag.classList.add(`tipo-${nome}`)
        container.appendChild(spanTag)
    })
    return container

}
// Função responsavel por criar a tabela de status dos pokemons
async function criarTabelaStatus(pokemon, cardDoTime) {

    const pokemonTableBody = document.getElementById('pokemon-table')
    if (!pokemonTableBody) {
        console.error('ERRO: <tbody> com ID "pokemon-table-body" não foi encontrado!')
        return
    }

    const rowId = `row-${cardDoTime.id}`

    // Remove uma linha caso ela exista
    const linhaExistente = document.getElementById(rowId)
    if (linhaExistente) {
        linhaExistente.remove()
    }

    const tr = document.createElement('tr')
    tr.id = rowId

    const tdImg = document.createElement('td')

    const pokemonImg = document.createElement('img')
    pokemonImg.src = pokemon.sprites?.front_default || 'url_da_sua_imagem_padrao.png'
    pokemonImg.alt = pokemon.name
    tdImg.appendChild(pokemonImg)
    tr.appendChild(tdImg)


    const tdTipos = document.createElement('td')
    const tiposContainer = document.createElement('div')
    tiposContainer.classList.add('tipos-tabela')

    pokemon.types.forEach(tipoInfo => {

        const nomeTipo = document.createElement('p')
        nomeTipo.textContent = tipoInfo.type.name

        nomeTipo.classList.add(`tipo-${tipoInfo.type.name}`)
        tiposContainer.appendChild(nomeTipo)
    })

    tdTipos.appendChild(tiposContainer)
    tr.appendChild(tdTipos)

    const tdForcaAtaque = document.createElement('td')
    const tdFraquezaAtaque = document.createElement('td')
    const tdResistencia = document.createElement('td')
    const tdFraquezaDefesa = document.createElement('td')
    const tdImunidade = document.createElement('td')

    try {

        const urlDoTipo = pokemon.types[0].type.url
        const respostaTipo = await fetch(urlDoTipo)
        const dadosDoTipo = await respostaTipo.json()
        const damageRelations = dadosDoTipo.damage_relations

        const fraquezasDef = damageRelations.double_damage_from.map(tipo => tipo.name)
        const resistDef = damageRelations.half_damage_from.map(tipo => tipo.name)
        const imuneDef = damageRelations.no_damage_from.map(tipo => tipo.name)
        const forcaAtk = damageRelations.double_damage_to.map(tipo => tipo.name)
        const fraquezasAtk = damageRelations.half_damage_to.map(tipo => tipo.name)

        tdFraquezaDefesa.appendChild(criarTagsDeTipoPorNome(fraquezasDef))
        tdResistencia.appendChild(criarTagsDeTipoPorNome(resistDef))
        tdImunidade.appendChild(criarTagsDeTipoPorNome(imuneDef))
        tdForcaAtaque.appendChild(criarTagsDeTipoPorNome(forcaAtk))
        tdFraquezaAtaque.appendChild(criarTagsDeTipoPorNome(fraquezasAtk))


    } catch (error) {
        console.error("Falha ao buscar relações de dano:", error)

        tdFraquezaDefesa.textContent = 'Erro'
        tdResistencia.textContent = 'Erro'
        tdImunidade.textContent = 'Erro'
        tdForcaAtaque.textContent = 'Erro'
        tdFraquezaAtaque.textContent = 'Erro'

    }

    tr.appendChild(tdForcaAtaque)
    tr.appendChild(tdFraquezaAtaque)
    tr.appendChild(tdResistencia)
    tr.appendChild(tdFraquezaDefesa)
    tr.appendChild(tdImunidade)
    pokemonTableBody.appendChild(tr)
}

// Função responsavel por selecionar o pokemon e adicionalo no time
async function selecionarPokemonParaTime(pokemon) {

    if (cardClicado) {

        const imgDoCard = cardClicado.querySelector('.pokemonTime')
        const nomeDoCard = cardClicado.querySelector('.nomePokemonTime')

        if (imgDoCard) imgDoCard.src = pokemon.sprites.front_default
        if (nomeDoCard) nomeDoCard.textContent = pokemon.name

        await criarTabelaStatus(pokemon, cardClicado)
        
        try {
           
            const indexDoCard = cardClicado.id.replace('card-pokemon', '')
            
           
            const slotMoveSet = document.getElementById(`moveset-slot-${indexDoCard}`)

            if (slotMoveSet) {
              
                atualizarSlotMoveSet(pokemon, slotMoveSet) 
            } else {
                console.error(`Slot de moveset moveset-slot-${indexDoCard} não encontrado!`)
            }
        } catch (e) {
            console.error('Falha ao atualizar o slot de Move Set:', e)
        }

    }
}

function atualizarSlotMoveSet(pokemon, slotElement){

    slotElement.innerHTML = ''

    const pokemonImg = document.createElement('img')
    pokemonImg.classList.add('moveset-sprite')
    pokemonImg.src = pokemon.sprites.front_default || 'url_da_sua_imagem_padrao.png'
    pokemonImg.alt = pokemon.name

    const nomePokemon = document.createElement('span')
    nomePokemon.classList.add('moveset-nome')
    nomePokemon.textContent = pokemon.name

    const tiposContainer = criarTiposPokemon(pokemon.types)

    slotElement.appendChild(pokemonImg)
    slotElement.appendChild(nomePokemon)
    slotElement.appendChild(tiposContainer)

    slotElement.addEventListener('click', () => {
        selecaoDePokemonParaMoves(pokemon, slotElement)
    })

}

function abrirModalMoves(listaDeMoves){

    const modalFundo = document.createElement('div')

    modalFundo.classList.add('modal-fundo', 'modal-fundo-moves')

    const modalContainer = document.createElement('div')
    modalContainer.classList.add('modal-container')

    const barraDeBusca = document.createElement('input')
    barraDeBusca.type = 'search'
    barraDeBusca.placeholder = 'Pesquisar movimento...'
    barraDeBusca.classList.add('modal-barra-busca')

    const listaMovesWrapper = document.createElement('div')
    listaMovesWrapper.classList.add('modal-cards-wrapper')


    listaDeMoves.forEach(moveInfo => {
   
        const itemMove = criarMovesParaModal(moveInfo)
        listaMovesWrapper.appendChild(itemMove)
    })


    barraDeBusca.addEventListener('input', () => {
        const termoBusca = barraDeBusca.value.toLowerCase()
        const todosOsItens = listaMovesWrapper.querySelectorAll('.move-item-modal')
        
        todosOsItens.forEach(item => {
            if (item.dataset.nome.includes(termoBusca)) {
                item.style.display = 'block' 
            } else {
                item.style.display = 'none'
            }
        })
    })


    modalFundo.addEventListener('click', (e) => {
        if (e.target === modalFundo) {
            modalFundo.remove()
            slotDeMoveAtivo = null
        }
    });

    modalContainer.appendChild(barraDeBusca)
    modalContainer.appendChild(listaMovesWrapper)
    modalFundo.appendChild(modalContainer)
    document.body.appendChild(modalFundo)

}

async function carregarTipoDoMove(urlDoMove, placeholderElement) {
    try {
        const resposta = await fetch(urlDoMove)
        if (!resposta.ok) throw new Error('Falha no fetch')
        
        const dadosDoMove = await resposta.json()
        const tipoDoMove = dadosDoMove.type.name

        placeholderElement.innerHTML = '' 
        

        const tagDeTipo = criarTagsDeTipoPorNome([tipoDoMove])
        placeholderElement.appendChild(tagDeTipo)

    } catch (error) {
        console.warn(`Falha ao carregar tipo do move ${urlDoMove}:`, error)
        placeholderElement.textContent = 'N/A'
    }
}

function criarMovesParaModal(moveInfo) {
   const moveName = moveInfo.move.name
    const moveUrl = moveInfo.move.url

    const move = document.createElement('button')
    move.classList.add('move-item-modal')
    move.dataset.nome = moveName


    const moveIcon = document.createElement('img')
    moveIcon.classList.add('move-modal-icon')

    moveIcon.src = './img/pokeball.png'
    moveIcon.alt = 'ícone de movimento'

    const moveNameSpan = document.createElement('span')
    moveNameSpan.classList.add('move-modal-name')
    moveNameSpan.textContent = moveName.replace('-', ' ')


    const typePlaceholder = document.createElement('div')
    typePlaceholder.classList.add('move-modal-type-placeholder')
    typePlaceholder.textContent = '...'


    move.appendChild(moveIcon)
    move.appendChild(moveNameSpan)
    move.appendChild(typePlaceholder)

   
    move.addEventListener('click', () => {
        processarMoves(moveUrl)
    })
   
    carregarTipoDoMove(moveUrl, typePlaceholder)

    return move
}

async function processarMoves(urlDoMove) {
  
    if (slotDeMoveAtivo) {
        slotDeMoveAtivo.innerHTML = '<span>Carregando...</span>'
    }

    try {
        const resposta = await fetch(urlDoMove)
        if (!resposta.ok) throw new Error('Falha no fetch do movimento')
        
        const dadosDoMove = await resposta.json()

        popularSlotComMove(dadosDoMove)

    } catch (error) {
        console.error("Falha ao buscar detalhes do movimento:", error)
        if (slotDeMoveAtivo) {
            slotDeMoveAtivo.textContent = 'Erro ao carregar'
        }
    } finally {
     
        const modal = document.querySelector('.modal-fundo-moves')
        if (modal) modal.remove()
    }
}

function popularSlotComMove(dadosDoMove) {
  
    if (!slotDeMoveAtivo) 
        return

    slotDeMoveAtivo.innerHTML = ''
    slotDeMoveAtivo.classList.add('move-preenchido')

    const nomeMove = document.createElement('span')
    nomeMove.textContent = dadosDoMove.name.replace('-', ' ')
    nomeMove.classList.add('move-nome')
    slotDeMoveAtivo.appendChild(nomeMove)

    const tipoTag = criarTagsDeTipoPorNome([dadosDoMove.type.name])
    slotDeMoveAtivo.appendChild(tipoTag)


    const detalhesMove = document.createElement('div')
    detalhesMove.classList.add('move-detalhes')

    const poderMove = document.createElement('span')

    poderMove.textContent = `Poder: ${dadosDoMove.power || '--'}`;

    const accMove = document.createElement('span')
    accMove.textContent = `Prec.: ${dadosDoMove.accuracy || '--'}`

    detalhesMove.appendChild(poderMove)
    detalhesMove.appendChild(accMove)
    slotDeMoveAtivo.appendChild(detalhesMove)


    slotDeMoveAtivo = null
}

function construirSecaoDeMoves(pokemon) {

    const containerSessaoMoves = document.getElementById('container-secao-moves')
    
    if (!containerSessaoMoves) {
        console.error('ERRO: "container-secao-moves" não encontrado no HTML!')
        return
    }

    containerSessaoMoves.innerHTML = ''

    const containerMoveSet = document.createElement('div')
    containerMoveSet.classList.add('move-set-pokemon')

    const pokemonMove = document.createElement('div')
    pokemonMove.classList.add('pokemon-move')

    const nomePokemon = document.createElement('p')
    nomePokemon.textContent = `Movimentos do ${pokemon.name}`

    const containerMoves = document.createElement('div')
    containerMoves.classList.add('moves')

    for (let i = 0; i < 4; i++) {

        const moveSlot = document.createElement('div')
        moveSlot.classList.add('move')

        const moveText = document.createElement('span')
        moveText.textContent = 'Clique para escolher um movimento'
        
        moveSlot.addEventListener('click', () => {

            slotDeMoveAtivo = moveSlot

            abrirModalMoves(pokemon.moves) 
        })

   
        moveSlot.appendChild(moveText)
        containerMoves.appendChild(moveSlot)
    }
    pokemonMove.appendChild(nomePokemon)
    containerMoveSet.appendChild(pokemonMove)
    containerMoveSet.appendChild(containerMoves)
    containerSessaoMoves.appendChild(containerMoveSet)
}

 function destacarSlotMoveSet(slotElement) {

    if (slotMoveSetAtivo) {
        slotMoveSetAtivo.classList.remove('slot-ativo') // Use uma classe CSS
    }

    // Adiciona o destaque no novo slot
    slotElement.classList.add('slot-ativo')

    // Atualiza a variável de estado
    slotMoveSetAtivo = slotElement

 }

function selecaoDePokemonParaMoves(pokemon, slotElement) {

    destacarSlotMoveSet(slotElement)
    
    construirSecaoDeMoves(pokemon)

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