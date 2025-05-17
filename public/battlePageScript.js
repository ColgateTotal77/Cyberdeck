import { destroyRoom } from './client.js'

let dataObj;
await fetch('/api/battleInfo')
    .then(res => res.json())
    .then(data => {
        console.log('Fetched battle info:', data);
        console.log(data);
        dataObj = data;

    });

const battleInfo = dataObj.battleInfo;
const userId = dataObj.userId;
const roomId = battleInfo.roomId;
const user = battleInfo.player1.userData.id === userId ? battleInfo.player1 : battleInfo.player2;
const opponent = battleInfo.player2.userData.id === userId ? battleInfo.player1 : battleInfo.player2;

document.getElementById("userInfo").innerHTML = user.userData.login;
document.getElementById("opponentInfo").innerHTML = opponent.userData.login;
        // this.battles.set(roomId, {
        //     player1: {userData: user, hp:30},
        //     player2: {userData: opponent, hp:30},
        //     roomId: roomId,
        //     current_turn_player_id : current_turn_player_id
        // });


document.getElementById('giveUpButton').addEventListener('click', () => {
    destroyRoom();
})