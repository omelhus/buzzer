const socket = io()
const active = document.querySelector('.js-active')
const buzzList = document.querySelector('.js-buzzes')
const clear = document.querySelector('.js-clear')
const players = document.querySelector('.js-players')

const soundMap = new Map();
let currentlyPlaying;

function play(sound) {
  if (!sound)
    return;
  if (currentlyPlaying) {
    currentlyPlaying.pause();
    currentlyPlaying.currentTime = 0;
  }
  var file = `sounds/${sound}`;
  if (soundMap.has(sound)) {
    currentlyPlaying = soundMap.get(sound);
  } else {
    const audio = new Audio(file);
    audio.play();
    soundMap.set(sound, audio);
    currentlyPlaying = audio;
  }
  currentlyPlaying.play();
}

socket.on('active', ({ count, users }) => {
  active.innerText = `${count} joined`
  players.innerHTML = users
    .map((user) => `<li><a href='#' onclick='play("${user.sound}")'>${user.name}</a></li>`)
    .join('')
})

socket.on('joined', ({ name, sound }, ) => {
  play(sound);
});

socket.on('buzzes', (buzzesMap) => {
  const buzzes = Array.from(buzzesMap, ([_key, values]) => values);
  if (buzzes.length === 1) {
    const { user: { sound } } = buzzes[0];
    play(sound);
  }
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

