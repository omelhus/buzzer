const socket = io()
const active = document.querySelector('.js-active')
const buzzList = document.querySelector('.js-buzzes')
const clear = document.querySelector('.js-clear')
const players = document.querySelector('.js-players')

const soundMap = new Map();

socket.on('buzzes', (buzzesMap) => {
  const buzzes = Array.from(buzzesMap, ([_key, values]) => values);
  buzzList.innerHTML = buzzes
    .map(
      ({
        latence,
        user: { name, team }
      }) => team ? `<li>${name} on Team ${team} ${latence ? `(+${latence}ms)` : ''}</li>` :
          `<li>${name} ${latence ? `(+${latence}ms)` : ''}</li>`)
    .join('')
})

clear.addEventListener('click', () => {
  socket.emit('clear')
})

