import { destroyRoom } from './client.js'

document.getElementById('giveUpButton').addEventListener('click', () => {
    destroyRoom();
})