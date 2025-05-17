import { destroyRoom } from './client.js'

let battleInfo;
await fetch('/api/battleInfo')
    .then(res => res.json())
    .then(data => {
        console.log('Fetched battle info:', data);
        battleInfo = data;

    });

const roomId = battleInfo.roomId;
const user = battleInfo.user;
const opponent = battleInfo.opponent;

document.getElementById("userInfo").innerHTML = user.userData.login;
document.getElementById("opponentInfo").innerHTML = opponent.userData.login;

                // user_socket.handshake.session.battleInfo = {
                //     user: {userData: user, hp:30},
                //     opponent: {userData: opponent, hp:30},
                //     roomId
                // };


document.getElementById('giveUpButton').addEventListener('click', () => {
    destroyRoom();
})