let main = {
    // --- GLOBAL GAME STATE ---
    variables: {
        turn: 'w',               
        selectedpiece: '',       
        highlighted: [],         
        lastMove: null,          
        moveCountSinceEvent: 0,  
        history: [],             
        pgnHistory: [],          
        moveNumber: 1,           
        clocks: { w: 300, b: 300 }, 
        timerInterval: null,     

        pieces: {
            w_king: { position: '5_1', img: '&#9812;', captured: false, moved: false, type: 'w_king' },
            w_queen: { position: '4_1', img: '&#9813;', captured: false, moved: false, type: 'w_queen' },
            w_bishop1: { position: '3_1', img: '&#9815;', captured: false, moved: false, type: 'w_bishop' },
            w_bishop2: { position: '6_1', img: '&#9815;', captured: false, moved: false, type: 'w_bishop' },
            w_knight1: { position: '2_1', img: '&#9816;', captured: false, moved: false, type: 'w_knight' },
            w_knight2: { position: '7_1', img: '&#9816;', captured: false, moved: false, type: 'w_knight' },
            w_rook1: { position: '1_1', img: '&#9814;', captured: false, moved: false, type: 'w_rook' },
            w_rook2: { position: '8_1', img: '&#9814;', captured: false, moved: false, type: 'w_rook' },
            w_pawn1: { position: '1_2', img: '&#9817;', captured: false, type: 'w_pawn', moved: false },
            w_pawn2: { position: '2_2', img: '&#9817;', captured: false, type: 'w_pawn', moved: false },
            w_pawn3: { position: '3_2', img: '&#9817;', captured: false, type: 'w_pawn', moved: false },
            w_pawn4: { position: '4_2', img: '&#9817;', captured: false, type: 'w_pawn', moved: false },
            w_pawn5: { position: '5_2', img: '&#9817;', captured: false, type: 'w_pawn', moved: false },
            w_pawn6: { position: '6_2', img: '&#9817;', captured: false, type: 'w_pawn', moved: false },
            w_pawn7: { position: '7_2', img: '&#9817;', captured: false, type: 'w_pawn', moved: false },
            w_pawn8: { position: '8_2', img: '&#9817;', captured: false, type: 'w_pawn', moved: false },

            b_king: { position: '5_8', img: '&#9818;', captured: false, moved: false, type: 'b_king' },
            b_queen: { position: '4_8', img: '&#9819;', captured: false, moved: false, type: 'b_queen' },
            b_bishop1: { position: '3_8', img: '&#9821;', captured: false, moved: false, type: 'b_bishop' },
            b_bishop2: { position: '6_8', img: '&#9821;', captured: false, moved: false, type: 'b_bishop' },
            b_knight1: { position: '2_8', img: '&#9822;', captured: false, moved: false, type: 'b_knight' },
            b_knight2: { position: '7_8', img: '&#9822;', captured: false, moved: false, type: 'b_knight' },
            b_rook1: { position: '1_8', img: '&#9820;', captured: false, moved: false, type: 'b_rook' },
            b_rook2: { position: '8_8', img: '&#9820;', captured: false, moved: false, type: 'b_rook' },
            b_pawn1: { position: '1_7', img: '&#9823;', captured: false, type: 'b_pawn', moved: false },
            b_pawn2: { position: '2_7', img: '&#9823;', captured: false, type: 'b_pawn', moved: false },
            b_pawn3: { position: '3_7', img: '&#9823;', captured: false, type: 'b_pawn', moved: false },
            b_pawn4: { position: '4_7', img: '&#9823;', captured: false, type: 'b_pawn', moved: false },
            b_pawn5: { position: '5_7', img: '&#9823;', captured: false, type: 'b_pawn', moved: false },
            b_pawn6: { position: '6_7', img: '&#9823;', captured: false, type: 'b_pawn', moved: false },
            b_pawn7: { position: '7_7', img: '&#9823;', captured: false, type: 'b_pawn', moved: false },
            b_pawn8: { position: '8_7', img: '&#9823;', captured: false, type: 'b_pawn', moved: false }
        }
    },

    methods: {
        // --- 1. RENDERING & UI CONTROL ---

        gamesetup: function () {
            document.querySelectorAll('.gamecell').forEach(cell => {
                cell.setAttribute('chess', 'null');
                cell.innerHTML = '';
            });
            
            for (let gamepiece in main.variables.pieces) {
                if (!main.variables.pieces[gamepiece].captured) {
                    let cell = document.getElementById(main.variables.pieces[gamepiece].position);
                    cell.innerHTML = main.variables.pieces[gamepiece].img;
                    cell.setAttribute('chess', gamepiece);
                }
            }
        },

        updateGraveyard: function() {
            let wCap = [], bCap = [];
            for (let p in main.variables.pieces) {
                let piece = main.variables.pieces[p];
                if (piece.captured) {
                    if (piece.type.startsWith('w')) wCap.push(piece.img);
                    else bCap.push(piece.img);
                }
            }
            document.getElementById('black-graveyard').innerHTML = wCap.join('');
            document.getElementById('white-graveyard').innerHTML = bCap.join('');
        },

        startTimer: function() {
            if(main.variables.timerInterval) clearInterval(main.variables.timerInterval);
            main.variables.timerInterval = setInterval(() => {
                main.variables.clocks[main.variables.turn]--;
                main.methods.updateClockUI();
                
                if(main.variables.clocks[main.variables.turn] <= 0) {
                    clearInterval(main.variables.timerInterval);
                    let winner = main.variables.turn === 'w' ? 'Black' : 'White';
                    let turnBox = document.getElementById('turn');
                    turnBox.innerHTML = "TIMEOUT! " + winner + " Wins!";
                    turnBox.classList.add('checkmate-alert');
                    
                    document.querySelectorAll('.gamecell').forEach(cell => {
                        cell.style.pointerEvents = 'none';
                    });
                }
            }, 1000);
        },

        updateClockUI: function() {
            let format = (time) => {
                let m = Math.floor(time / 60);
                let s = time % 60;
                return (m < 10 ? '0': '') + m + ':' + (s < 10 ? '0' : '') + s;
            };
            document.getElementById('white-clock').innerText = format(main.variables.clocks.w);
            document.getElementById('black-clock').innerText = format(main.variables.clocks.b);
        },

        getAlgebraic: function(pieceObj, startId, targetId, isCapture) {
            const files = {1:'a', 2:'b', 3:'c', 4:'d', 5:'e', 6:'f', 7:'g', 8:'h'};
            let type = pieceObj.type.split('_')[1];
            let symbol = { 'king': 'K', 'queen': 'Q', 'rook': 'R', 'bishop': 'B', 'knight': 'N', 'pawn': '' }[type];
            let targetSquare = files[targetId.split('_')[0]] + targetId.split('_')[1];

            if (type === 'pawn') {
                return isCapture ? (files[startId.split('_')[0]] + 'x' + targetSquare) : targetSquare;
            }
            return symbol + (isCapture ? 'x' : '') + targetSquare;
        },

        togglehighlight: function (options) {
            options.forEach(function (element) {
                let el = document.getElementById(element);
                ['green', 'shake-little', 'neongreen_txt'].forEach(cls => el.classList.toggle(cls));
            });
        },


        // --- 2. GAME LOGIC & MOVEMENT RULES ---

        getPieceAt: function(coord) {
            for (let piece in main.variables.pieces) {
                if (!main.variables.pieces[piece].captured && main.variables.pieces[piece].position === coord) {
                    return piece;
                }
            }
            return 'null'; 
        },

        getRawOptions: function(selectedpiece, ignoreCastling = false) {
            let position = { x: parseInt(main.variables.pieces[selectedpiece].position.split('_')[0]), y: parseInt(main.variables.pieces[selectedpiece].position.split('_')[1]) };
            let coordinates = [];
            let type = main.variables.pieces[selectedpiece].type;
            let color = type.slice(0, 1);

            let addSlidingMoves = (dirs) => {
                dirs.forEach(dir => {
                    for (let i = 1; i <= 7; i++) {
                        let nx = position.x + (dir.x * i), ny = position.y + (dir.y * i);
                        if (nx < 1 || nx > 8 || ny < 1 || ny > 8) break; 
                        
                        let targetId = nx + '_' + ny;
                        let pieceAtTarget = main.methods.getPieceAt(targetId);
                        
                        if (pieceAtTarget === 'null') { coordinates.push(targetId); } 
                        else if (pieceAtTarget.slice(0, 1) !== color) { coordinates.push(targetId); break; } 
                        else { break; } 
                    }
                });
            };

            switch (type) {
                case 'w_king': case 'b_king':
                    let kDirs = [{x:1,y:1},{x:1,y:0},{x:1,y:-1},{x:0,y:-1},{x:-1,y:-1},{x:-1,y:0},{x:-1,y:1},{x:0,y:1}];
                    kDirs.forEach(dir => {
                        let nx = position.x + dir.x, ny = position.y + dir.y;
                        if (nx >= 1 && nx <= 8 && ny >= 1 && ny <= 8) {
                            if (main.methods.getPieceAt(nx+'_'+ny).slice(0,1) !== color) coordinates.push(nx+'_'+ny);
                        }
                    });
                    
                    if (!ignoreCastling && !main.variables.pieces[selectedpiece].moved && !main.methods.isKingInCheck(color)) {
                        let rank = color === 'w' ? '1' : '8';
                        if (main.methods.getPieceAt('6_'+rank) === 'null' && main.methods.getPieceAt('7_'+rank) === 'null') {
                            let rook = color + '_rook2';
                            if (main.variables.pieces[rook] && !main.variables.pieces[rook].moved && !main.variables.pieces[rook].captured) {
                                if (!main.methods.isSquareAttacked('6_'+rank, color === 'w' ? 'b' : 'w')) coordinates.push('7_'+rank);
                            }
                        }
                        if (main.methods.getPieceAt('4_'+rank) === 'null' && main.methods.getPieceAt('3_'+rank) === 'null' && main.methods.getPieceAt('2_'+rank) === 'null') {
                            let rook = color + '_rook1';
                            if (main.variables.pieces[rook] && !main.variables.pieces[rook].moved && !main.variables.pieces[rook].captured) {
                                if (!main.methods.isSquareAttacked('4_'+rank, color === 'w' ? 'b' : 'w')) coordinates.push('3_'+rank);
                            }
                        }
                    }
                    break;
                case 'w_queen': case 'b_queen':
                    addSlidingMoves([{x:1,y:1},{x:1,y:-1},{x:-1,y:1},{x:-1,y:-1},{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}]); break;
                case 'w_bishop': case 'b_bishop':
                    addSlidingMoves([{x:1,y:1},{x:1,y:-1},{x:-1,y:1},{x:-1,y:-1}]); break;
                case 'w_rook': case 'b_rook':
                    addSlidingMoves([{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}]); break;
                case 'w_knight': case 'b_knight':
                    let nDirs = [{x:-1,y:2},{x:1,y:2},{x:1,y:-2},{x:-1,y:-2},{x:2,y:1},{x:2,y:-1},{x:-2,y:-1},{x:-2,y:1}];
                    nDirs.forEach(dir => {
                        let nx = position.x + dir.x, ny = position.y + dir.y;
                        if (nx >= 1 && nx <= 8 && ny >= 1 && ny <= 8) {
                            if (main.methods.getPieceAt(nx+'_'+ny).slice(0,1) !== color) coordinates.push(nx+'_'+ny);
                        }
                    });
                    break;
                case 'w_pawn':
                    let wpF1 = position.x + '_' + (position.y + 1);
                    if (main.methods.getPieceAt(wpF1) === 'null') {
                        coordinates.push(wpF1);
                        let wpF2 = position.x + '_' + (position.y + 2);
                        if (!main.variables.pieces[selectedpiece].moved && main.methods.getPieceAt(wpF2) === 'null') coordinates.push(wpF2);
                    }
                    if (main.methods.getPieceAt((position.x + 1) + '_' + (position.y + 1)).slice(0,1) === 'b') coordinates.push((position.x + 1) + '_' + (position.y + 1));
                    if (main.methods.getPieceAt((position.x - 1) + '_' + (position.y + 1)).slice(0,1) === 'b') coordinates.push((position.x - 1) + '_' + (position.y + 1));
                    if (main.variables.lastMove && main.variables.lastMove.isDoubleJump && main.variables.lastMove.targetId.split('_')[1] == position.y) {
                        let epX = main.variables.lastMove.targetId.split('_')[0];
                        if (Math.abs(epX - position.x) === 1) coordinates.push(epX + '_' + (position.y + 1));
                    }
                    break;
                case 'b_pawn':
                    let bpF1 = position.x + '_' + (position.y - 1);
                    if (main.methods.getPieceAt(bpF1) === 'null') {
                        coordinates.push(bpF1);
                        let bpF2 = position.x + '_' + (position.y - 2);
                        if (!main.variables.pieces[selectedpiece].moved && main.methods.getPieceAt(bpF2) === 'null') coordinates.push(bpF2);
                    }
                    if (main.methods.getPieceAt((position.x + 1) + '_' + (position.y - 1)).slice(0,1) === 'w') coordinates.push((position.x + 1) + '_' + (position.y - 1));
                    if (main.methods.getPieceAt((position.x - 1) + '_' + (position.y - 1)).slice(0,1) === 'w') coordinates.push((position.x - 1) + '_' + (position.y - 1));
                    if (main.variables.lastMove && main.variables.lastMove.isDoubleJump && main.variables.lastMove.targetId.split('_')[1] == position.y) {
                        let epX = main.variables.lastMove.targetId.split('_')[0];
                        if (Math.abs(epX - position.x) === 1) coordinates.push(epX + '_' + (position.y - 1));
                    }
                    break;
            }
            return coordinates;
        },

        isSquareAttacked: function(coord, attackerColor) {
            for (let piece in main.variables.pieces) {
                let p = main.variables.pieces[piece];
                if (!p.captured && p.type.slice(0, 1) === attackerColor) {
                    let moves = main.methods.getRawOptions(piece, true); 
                    if (moves.includes(coord)) return true;
                }
            }
            return false;
        },

        isKingInCheck: function(color) {
            let kingPos = main.variables.pieces[color + '_king'].position;
            return main.methods.isSquareAttacked(kingPos, color === 'w' ? 'b' : 'w');
        },

        isMoveLegal: function(pieceId, targetCoord) {
            let piece = main.variables.pieces[pieceId];
            let originalPos = piece.position;
            let capturedPieceId = main.methods.getPieceAt(targetCoord);
            
            let isEnPassant = false, epCapturedId = null;
            if (piece.type.includes('pawn') && targetCoord.split('_')[0] !== originalPos.split('_')[0] && capturedPieceId === 'null') {
                isEnPassant = true;
                epCapturedId = main.methods.getPieceAt(targetCoord.split('_')[0] + '_' + originalPos.split('_')[1]);
            }

            piece.position = targetCoord;
            if (capturedPieceId !== 'null') main.variables.pieces[capturedPieceId].captured = true;
            if (isEnPassant && epCapturedId !== 'null') main.variables.pieces[epCapturedId].captured = true;

            let isLegal = !main.methods.isKingInCheck(piece.type.slice(0, 1));

            piece.position = originalPos;
            if (capturedPieceId !== 'null') main.variables.pieces[capturedPieceId].captured = false;
            if (isEnPassant && epCapturedId !== 'null') main.variables.pieces[epCapturedId].captured = false;

            return isLegal; 
        },

        isDraw: function() {
            if (main.variables.moveCountSinceEvent >= 100) return "Draw by 50-move rule!";
            
            let currentBoard = JSON.stringify(main.variables.pieces);
            if (main.variables.history.filter(state => state === currentBoard).length >= 3) return "Draw by 3-fold repetition!";

            let activePieces = Object.values(main.variables.pieces).filter(p => !p.captured);
            if (activePieces.length <= 2) return "Draw by insufficient material!";

            return false;
        },


        // --- 3. EVENT EXECUTORS ---

        moveoptions: function (selectedpiece) {
            if (main.variables.highlighted.length != 0) main.methods.togglehighlight(main.variables.highlighted);

            let rawMoves = main.methods.getRawOptions(selectedpiece);
            let legalMoves = rawMoves.filter(coord => main.methods.isMoveLegal(selectedpiece, coord));

            main.variables.highlighted = legalMoves;
            main.methods.togglehighlight(legalMoves);
        },

        executeMove: function (target) {
            let selectedpiece = main.variables.selectedpiece;
            let pieceIdStr = document.getElementById(selectedpiece).getAttribute('chess');
            let pieceObj = main.variables.pieces[pieceIdStr];
            let isDoubleJump = false;
            let color = pieceObj.type.slice(0,1);
            let isCapture = false;

            if (pieceObj.type.includes('king') && Math.abs(parseInt(target.id.split('_')[0]) - parseInt(selectedpiece.split('_')[0])) > 1) {
                let rank = color === 'w' ? '1' : '8';
                let isKingside = target.id == '7_' + rank;
                let rookName = color + '_rook' + (isKingside ? '2' : '1');
                main.variables.pieces[rookName].position = isKingside ? '6_' + rank : '4_' + rank;
                main.variables.pieces[rookName].moved = true;
            }

            if (pieceObj.type.includes('pawn') && target.id.split('_')[0] !== selectedpiece.split('_')[0] && main.methods.getPieceAt(target.id) === 'null') {
                let capId = main.methods.getPieceAt(target.id.split('_')[0] + '_' + selectedpiece.split('_')[1]);
                if (capId !== 'null') main.variables.pieces[capId].captured = true;
                isCapture = true;
            }

            let targetPieceId = main.methods.getPieceAt(target.id);
            if (targetPieceId !== 'null') {
                main.variables.pieces[targetPieceId].captured = true;
                isCapture = true;
            }

            let pgnMove = main.methods.getAlgebraic(pieceObj, selectedpiece, target.id, isCapture);
            if (pieceObj.type.includes('king') && Math.abs(parseInt(target.id.split('_')[0]) - parseInt(selectedpiece.split('_')[0])) > 1) {
                pgnMove = target.id.split('_')[0] == '7' ? 'O-O' : 'O-O-O'; 
            }

            if (pieceObj.type.includes('pawn') || isCapture) main.variables.moveCountSinceEvent = 0;
            else main.variables.moveCountSinceEvent++;
            main.variables.history.push(JSON.stringify(main.variables.pieces));

            if (pieceObj.type.includes('pawn')) {
                let startY = parseInt(selectedpiece.split('_')[1]);
                let endY = parseInt(target.id.split('_')[1]);
                if (Math.abs(startY - endY) === 2) isDoubleJump = true;
                
                if (endY === 8 || endY === 1) {
                    let promo = prompt("Promote Pawn to: \nQ = Queen\nR = Rook\nB = Bishop\nN = Knight", "Q").toUpperCase();
                    let types = { 'Q': 'queen', 'R': 'rook', 'B': 'bishop', 'N': 'knight' };
                    let imgs = color === 'w' ? {'Q':'&#9813;','R':'&#9814;','B':'&#9815;','N':'&#9816;'} : {'Q':'&#9819;','R':'&#9820;','B':'&#9821;','N':'&#9822;'};
                    promo = types[promo] ? promo : 'Q'; 
                    pieceObj.type = color + '_' + types[promo];
                    pieceObj.img = imgs[promo];
                    pgnMove += "=" + promo; 
                }
            }

            if (color === 'w') {
                main.variables.pgnHistory.push(`<span class="move-num">${main.variables.moveNumber}.</span> <span class="white-move">${pgnMove}</span> `);
            } else {
                main.variables.pgnHistory[main.variables.pgnHistory.length - 1] += `<span class="black-move">${pgnMove}</span><br>`;
                main.variables.moveNumber++;
            }
            let pgnList = document.getElementById('pgn-list');
            pgnList.innerHTML = main.variables.pgnHistory.join('');
            pgnList.scrollTop = pgnList.scrollHeight; 

            pieceObj.position = target.id;
            pieceObj.moved = true;
            main.variables.lastMove = { piece: pieceIdStr, startId: selectedpiece, targetId: target.id, isDoubleJump: isDoubleJump };

            main.methods.gamesetup();
            main.methods.updateGraveyard();
        },

        endturn: function () {
            main.variables.turn = main.variables.turn == 'w' ? 'b' : 'w';
            
            main.methods.togglehighlight(main.variables.highlighted);
            main.variables.highlighted.length = 0;
            main.variables.selectedpiece = '';

            let uiTurnBox = document.getElementById('turn');
            uiTurnBox.classList.remove('turnhighlight', 'check-alert', 'checkmate-alert', 'stalemate-alert');

            let drawMessage = main.methods.isDraw();
            if (drawMessage) {
                uiTurnBox.innerHTML = drawMessage;
                uiTurnBox.classList.add('stalemate-alert');
                clearInterval(main.variables.timerInterval); return;
            }

            let hasLegalMoves = false;
            for (let piece in main.variables.pieces) {
                let p = main.variables.pieces[piece];
                if (!p.captured && p.type.slice(0,1) === main.variables.turn) {
                    let moves = main.methods.getRawOptions(piece);
                    if (moves.some(coord => main.methods.isMoveLegal(piece, coord))) {
                        hasLegalMoves = true;
                        break;
                    }
                }
            }

            if (!hasLegalMoves) {
                clearInterval(main.variables.timerInterval); 
                if (main.methods.isKingInCheck(main.variables.turn)) {
                    uiTurnBox.innerHTML = "CHECKMATE! " + (main.variables.turn == 'w' ? "Black" : "White") + " Wins!";
                    uiTurnBox.classList.add('checkmate-alert');
                } else {
                    uiTurnBox.innerHTML = "STALEMATE! It's a draw.";
                    uiTurnBox.classList.add('stalemate-alert');
                }
            } else {
                if (main.methods.isKingInCheck(main.variables.turn)) {
                    uiTurnBox.innerHTML = "CHECK! " + (main.variables.turn == 'w' ? "White" : "Black") + " to move.";
                    uiTurnBox.classList.add('check-alert');
                } else {
                    uiTurnBox.innerHTML = "It's " + (main.variables.turn == 'w' ? "White's" : "Black's") + " Turn!";
                    uiTurnBox.classList.add('turnhighlight');
                    window.setTimeout(() => uiTurnBox.classList.remove('turnhighlight'), 1500);
                }
                main.methods.startTimer(); 
            }
        },
        
        pauseGame: function() {
            if (main.variables.timerInterval) {
                clearInterval(main.variables.timerInterval);
                main.variables.timerInterval = null;
                document.getElementById('pause-btn').innerText = 'Resume';
                
                let overlay = document.getElementById('pause-overlay');
                if (overlay) overlay.style.display = 'flex';
                
                document.querySelectorAll('.gamecell').forEach(cell => {
                    cell.style.pointerEvents = 'none';
                });
            } else {
                main.methods.startTimer();
                document.getElementById('pause-btn').innerText = 'Pause';
                
                let overlay = document.getElementById('pause-overlay');
                if (overlay) overlay.style.display = 'none';
                
                document.querySelectorAll('.gamecell').forEach(cell => {
                    cell.style.pointerEvents = 'auto';
                });
            }
        },
        
        resetGame: function() {
            location.reload(); 
        }
    }
};

// --- INITIALIZATION & EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', function () {
    main.methods.gamesetup();
    main.methods.updateClockUI();

    document.getElementById('flip-board-btn').addEventListener('click', function() {
        let gameBoard = document.getElementById('game');
        gameBoard.classList.toggle('flipped');
        
        const headers = document.querySelectorAll('.player-header');
        gameBoard.parentNode.insertBefore(headers[0], gameBoard.nextSibling);
        gameBoard.parentNode.insertBefore(headers[1], gameBoard);
    });

    document.querySelectorAll('.gamecell').forEach(cell => {
        cell.addEventListener('click', function (e) {
            let clickedPieceId = this.getAttribute('chess');
            let clickedCellId = e.target.id;

            if (main.variables.selectedpiece == '' && clickedPieceId != 'null' && clickedPieceId.slice(0, 1) == main.variables.turn) {
                main.variables.selectedpiece = clickedCellId;
                main.methods.moveoptions(clickedPieceId);
                if (!main.variables.timerInterval) main.methods.startTimer();
            } 
            else if (main.variables.selectedpiece != '' && main.variables.highlighted.includes(clickedCellId)) {
                main.methods.executeMove({id: clickedCellId});
                main.methods.endturn();
            } 
            else if (main.variables.selectedpiece != '' && clickedPieceId != 'null' && clickedPieceId.slice(0, 1) == main.variables.turn) {
                main.methods.togglehighlight(main.variables.highlighted);
                main.variables.highlighted.length = 0;
                main.variables.selectedpiece = clickedCellId;
                main.methods.moveoptions(clickedPieceId);
            }
            else if (main.variables.selectedpiece != '') {
                main.methods.togglehighlight(main.variables.highlighted);
                main.variables.highlighted.length = 0;
                main.variables.selectedpiece = '';
            }
        });
    });

    document.body.addEventListener('contextmenu', function (e) { 
        e.preventDefault(); 
    });

    document.getElementById('pause-btn').addEventListener('click', function() {
        main.methods.pauseGame();
    });
    
    document.getElementById('reset-btn').addEventListener('click', function() {
        main.methods.resetGame();
    });
});
