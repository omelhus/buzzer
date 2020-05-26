const http = require('http')
const express = require('express')
const socketio = require('socket.io')

const soundsFolder = './public/sounds/';
const fs = require('fs');

const app = express();
const server = http.Server(app);
const io = socketio(server);

const title = 'Jeopardy!'

const initData = () => ({
  users: new Map(),
  buzzes: new Map(),
  firstResponse: null,
});

let data = initData();
const userSounds = new Map();

const getBuzzerValues = (data) => Array.from(data.buzzes, ([_key, values]) => values);

const getData = () => ({
  users: Array.from(data.users, ([_key, values]) => values),
  count: data.users.size,
  buzzes: getBuzzerValues(data)
})

const computeLatence = (firstResponse) => new Date().getTime() - firstResponse
const availableSounds = [];
fs.readdir(soundsFolder, (err, files) => {
  files.forEach(file => {
    availableSounds.push(file);
  });
});

app.use(express.static('public'))
app.set('view engine', 'pug')

app.get('/', (_req, res) => res.render('index', { title }))
app.get('/host', (_req, res) => res.render('host', Object.assign({ title }, getData())))
app.get('/obs', (_req, res) => res.render('buzzes', Object.assign({ title }, getData())))

const getNextAvailableSound = () => {
  if (availableSounds.length === 0)
    return null;
  const index = Math.floor(Math.random() * availableSounds.length);
  return availableSounds.splice(index, 1)[0];
}

io.on('connection', (socket) => {
  let user;
  const join = function (_user, mute) {
    user = _user;
    user.sound = getNextAvailableSound();
    data.users.set(user.id, user)
    const users = Array.from(data.users, ([_key, values]) => values);
    io.emit('active', getData());
    io.emit('joined', { name: user.name, sound: !mute ? user.sound : null });
    console.log(`${user.name} joined with sound ${user.sound}!`)
  };

  socket.on('join', (_user) => {
    join(_user);
  })

  socket.on('buzz', (_user) => {
    if (!user) join(_user, true);

    const latence = data.firstResponse
      ? computeLatence(data.firstResponse)
      : null;

    if (data.buzzes.size === 0) {
      data.firstResponse = new Date().getTime()
    }

    if (user.name && !data.buzzes.get(user.name)) {
      data.buzzes.set(
        user.name,
        { latence, user: { name: user.name, team: user.team, sound: user.sound } }
      )
      io.emit('buzzes', [...data.buzzes])
      console.log(`${latence} ${user.name} buzzed in! ${latence ? `(+ ${latence}ms)` : ''} ${user.sound}`)
    }
  })

  socket.on('clear', () => {
    data.buzzes = new Map();
    data.firstResponse = null;
    io.emit('buzzes', [...data.buzzes])
    console.log(`Clear buzzes`)
  })

  socket.on('disconnect', () => {
    if (user && user.id) {
      data.users.delete(user.id);
      if (user.sound)
        availableSounds.push(user.sound);
    }
    io.emit('active', getData());
  })
})

const port = process.env.PORT || 8090;
server.listen(port, () => console.log(`Listening on ${port}`))
