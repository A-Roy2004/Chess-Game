let main = {
    // --- GLOBAL GAME STATE ---
    variables: {
        turn: 'w',               // Tracks whose turn it is ('w' for white, 'b' for black)
        selectedpiece: '',       // Holds the DOM ID of the currently clicked piece
        highlighted: [],         // Array of valid move coordinates for the selected piece
        lastMove: null,          // Used to track En Passant availability (needs to know previous move)
        moveCountSinceEvent: 0,  // Used for 50-move rule (resets on pawn move or piece capture)
        history: [],             // Snapshots of the board to check 3-fold repetition
        pgnHistory: [],          // Strings holding formatted algebraic moves for the sidebar
        moveNumber: 1,           // Current full move number (e.g., 1. e4 e5)
        clocks: { w: 300, b: 300 }, // Clocks in seconds (300 seconds = 5 minutes per player)
        timerInterval: null,     // Holds the setInterval function for the clock

        // The Master Object containing all piece data. 
        // We update THIS JS object first, then re-render the HTML to match it.
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

        // Clears the HTML board and places pieces based on variables.pieces data
        gamesetup: function () {
            $('.gamecell').attr('chess', 'null').html(''); // Clear the board visually
            for (let gamepiece in main.variables.pieces) {
                if (!main.variables.pieces[gamepiece].captured) {
                    $('#' + main.variables.pieces[gamepiece].position).html(main.variables.pieces[gamepiece].img);
                    $('#' + main.variables.pieces[gamepiece].position).attr('chess', gamepiece);
                }
            }
        },

        // Updates the "Graveyards" beside the clocks by finding captured pieces
        updateGraveyard: function() {
            let wCap = [], bCap = [];
            for (let p in main.variables.pieces) {
                let piece = main.variables.pieces[p];
                if (piece.captured) {
                    if (piece.type.startsWith('w')) wCap.push(piece.img);
                    else bCap.push(piece.img);
                }
            }
            $('#black-graveyard').html(wCap.join('')); // White pieces go to Black's side
            $('#white-graveyard').html(bCap.join('')); // Black pieces go to White's side
        },

        // Starts the countdown clock for the current player
        startTimer: function() {
            if(main.variables.timerInterval) clearInterval(main.variables.timerInterval);
            main.variables.timerInterval = setInterval(() => {
                main.variables.clocks[main.variables.turn]--;
                main.methods.updateClockUI();
                
                // End game if timer hits 0
                if(main.variables.clocks[main.variables.turn] <= 0) {
                    clearInterval(main.variables.timerInterval);
                    let winner = main.variables.turn === 'w' ? 'Black' : 'White';
                    $('#turn').html("TIMEOUT! " + winner + " Wins!").addClass('checkmate-alert');
                    $('.gamecell').off('click'); // Disable board clicks
                }
            }, 1000); // Ticks every 1 second
        },

        // Formats seconds into MM:SS and displays it
        updateClockUI: function() {
            let format = (time) => {
                let m = Math.floor(time / 60);
                let s = time % 60;
                return (m < 10 ? '0': '') + m + ':' + (s < 10 ? '0' : '') + s;
            };
            $('#white-clock').text(format(main.variables.clocks.w));
            $('#black-clock').text(format(main.variables.clocks.b));
        },

        // Generates standard Algebraic Notation (e.g. Nf3, exd5) for the sidebar
        getAlgebraic: function(pieceObj, startId, targetId, isCapture) {
            const files = {1:'a', 2:'b', 3:'c', 4:'d', 5:'e', 6:'f', 7:'g', 8:'h'}; // Map grid X to file letters
            let type = pieceObj.type.split('_')[1];
            let symbol = { 'king': 'K', 'queen': 'Q', 'rook': 'R', 'bishop': 'B', 'knight': 'N', 'pawn': '' }[type];
            let targetSquare = files[targetId.split('_')[0]] + targetId.split('_')[1];

            if (type === 'pawn') {
                return isCapture ? (files[startId.split('_')[0]] + 'x' + targetSquare) : targetSquare;
            }
            return symbol + (isCapture ? 'x' : '') + targetSquare;
        },

        // Toggles the green highlight and shaking animation on valid squares
        togglehighlight: function (options) {
            options.forEach(function (element) {
                $('#' + element).toggleClass("green shake-little neongreen_txt");
            });
        },


        // --- 2. GAME LOGIC & MOVEMENT RULES ---

        // Safe getter that checks our JS object, not the HTML DOM
        getPieceAt: function(coord) {
            for (let piece in main.variables.pieces) {
                if (!main.variables.pieces[piece].captured && main.variables.pieces[piece].position === coord) {
                    return piece;
                }
            }
            return 'null'; // Square is empty
        },

        // Generates pseudo-legal moves (how pieces move, ignoring King safety for a moment)
        getRawOptions: function(selectedpiece, ignoreCastling = false) {
            let position = { x: parseInt(main.variables.pieces[selectedpiece].position.split('_')[0]), y: parseInt(main.variables.pieces[selectedpiece].position.split('_')[1]) };
            let coordinates = [];
            let type = main.variables.pieces[selectedpiece].type;
            let color = type.slice(0, 1);

            // Helper function for Sliding Pieces (Bishop, Rook, Queen)
            let addSlidingMoves = (dirs) => {
                dirs.forEach(dir => {
                    for (let i = 1; i <= 7; i++) {
                        let nx = position.x + (dir.x * i), ny = position.y + (dir.y * i);
                        if (nx < 1 || nx > 8 || ny < 1 || ny > 8) break; // Out of bounds
                        
                        let targetId = nx + '_' + ny;
                        let pieceAtTarget = main.methods.getPieceAt(targetId);
                        
                        if (pieceAtTarget === 'null') { coordinates.push(targetId); } // Empty square, keep going
                        else if (pieceAtTarget.slice(0, 1) !== color) { coordinates.push(targetId); break; } // Capture enemy, stop sliding
                        else { break; } // Blocked by own piece, stop sliding
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
                    
                    // Castling Rule Checks
                    if (!ignoreCastling && !main.variables.pieces[selectedpiece].moved && !main.methods.isKingInCheck(color)) {
                        let rank = color === 'w' ? '1' : '8';
                        // Kingside
                        if (main.methods.getPieceAt('6_'+rank) === 'null' && main.methods.getPieceAt('7_'+rank) === 'null') {
                            let rook = color + '_rook2';
                            if (main.variables.pieces[rook] && !main.variables.pieces[rook].moved && !main.variables.pieces[rook].captured) {
                                if (!main.methods.isSquareAttacked('6_'+rank, color === 'w' ? 'b' : 'w')) coordinates.push('7_'+rank);
                            }
                        }
                        // Queenside
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
                    // Standard move
                    let wpF1 = position.x + '_' + (position.y + 1);
                    if (main.methods.getPieceAt(wpF1) === 'null') {
                        coordinates.push(wpF1);
                        // Double jump on first move
                        let wpF2 = position.x + '_' + (position.y + 2);
                        if (!main.variables.pieces[selectedpiece].moved && main.methods.getPieceAt(wpF2) === 'null') coordinates.push(wpF2);
                    }
                    // Diagonal Captures
                    if (main.methods.getPieceAt((position.x + 1) + '_' + (position.y + 1)).slice(0,1) === 'b') coordinates.push((position.x + 1) + '_' + (position.y + 1));
                    if (main.methods.getPieceAt((position.x - 1) + '_' + (position.y + 1)).slice(0,1) === 'b') coordinates.push((position.x - 1) + '_' + (position.y + 1));
                    // En Passant
                    if (main.variables.lastMove && main.variables.lastMove.isDoubleJump && main.variables.lastMove.targetId.split('_')[1] == position.y) {
                        let epX = main.variables.lastMove.targetId.split('_')[0];
                        if (Math.abs(epX - position.x) === 1) coordinates.push(epX + '_' + (position.y + 1));
                    }
                    break;
                case 'b_pawn':
                    // Standard move
                    let bpF1 = position.x + '_' + (position.y - 1);
                    if (main.methods.getPieceAt(bpF1) === 'null') {
                        coordinates.push(bpF1);
                        // Double jump on first move
                        let bpF2 = position.x + '_' + (position.y - 2);
                        if (!main.variables.pieces[selectedpiece].moved && main.methods.getPieceAt(bpF2) === 'null') coordinates.push(bpF2);
                    }
                    // Diagonal Captures
                    if (main.methods.getPieceAt((position.x + 1) + '_' + (position.y - 1)).slice(0,1) === 'w') coordinates.push((position.x + 1) + '_' + (position.y - 1));
                    if (main.methods.getPieceAt((position.x - 1) + '_' + (position.y - 1)).slice(0,1) === 'w') coordinates.push((position.x - 1) + '_' + (position.y - 1));
                    // En Passant
                    if (main.variables.lastMove && main.variables.lastMove.isDoubleJump && main.variables.lastMove.targetId.split('_')[1] == position.y) {
                        let epX = main.variables.lastMove.targetId.split('_')[0];
                        if (Math.abs(epX - position.x) === 1) coordinates.push(epX + '_' + (position.y - 1));
                    }
                    break;
            }
            return coordinates;
        },

        // Used by Castling and Check mechanics to see if a square is threatened by an enemy
        isSquareAttacked: function(coord, attackerColor) {
            for (let piece in main.variables.pieces) {
                let p = main.variables.pieces[piece];
                if (!p.captured && p.type.slice(0, 1) === attackerColor) {
                    let moves = main.methods.getRawOptions(piece, true); // true = ignore castling to avoid infinite loops
                    if (moves.includes(coord)) return true;
                }
            }
            return false;
        },

        // Helper to check if the current player's King is under attack
        isKingInCheck: function(color) {
            let kingPos = main.variables.pieces[color + '_king'].position;
            return main.methods.isSquareAttacked(kingPos, color === 'w' ? 'b' : 'w');
        },

        // THE SIMULATOR: Tests a move in memory to ensure it doesn't leave the King in Check (Prevents moving pinned pieces)
        isMoveLegal: function(pieceId, targetCoord) {
            let piece = main.variables.pieces[pieceId];
            let originalPos = piece.position;
            let capturedPieceId = main.methods.getPieceAt(targetCoord);
            
            // En Passant edge case for simulation
            let isEnPassant = false, epCapturedId = null;
            if (piece.type.includes('pawn') && targetCoord.split('_')[0] !== originalPos.split('_')[0] && capturedPieceId === 'null') {
                isEnPassant = true;
                epCapturedId = main.methods.getPieceAt(targetCoord.split('_')[0] + '_' + originalPos.split('_')[1]);
            }

            // SIMULATE: Temporarily move piece and remove captured piece
            piece.position = targetCoord;
            if (capturedPieceId !== 'null') main.variables.pieces[capturedPieceId].captured = true;
            if (isEnPassant && epCapturedId !== 'null') main.variables.pieces[epCapturedId].captured = true;

            // TEST: Is the King safe now?
            let isLegal = !main.methods.isKingInCheck(piece.type.slice(0, 1));

            // REVERT: Put everything back to how it was before returning the result
            piece.position = originalPos;
            if (capturedPieceId !== 'null') main.variables.pieces[capturedPieceId].captured = false;
            if (isEnPassant && epCapturedId !== 'null') main.variables.pieces[epCapturedId].captured = false;

            return isLegal; // Returns true if the move is allowed
        },

        // FIDE Draw Checks (50-move rule, 3-fold repetition, Insufficient Material)
        isDraw: function() {
            // 1. 50-move rule (100 half-moves without pawn push or capture)
            if (main.variables.moveCountSinceEvent >= 100) return "Draw by 50-move rule!";
            
            // 2. Threefold repetition
            let currentBoard = JSON.stringify(main.variables.pieces);
            if (main.variables.history.filter(state => state === currentBoard).length >= 3) return "Draw by 3-fold repetition!";

            // 3. Insufficient material (e.g., King vs King)
            let activePieces = Object.values(main.variables.pieces).filter(p => !p.captured);
            if (activePieces.length <= 2) return "Draw by insufficient material!";

            return false;
        },


        // --- 3. EVENT EXECUTORS ---

        // Triggers when a piece is clicked to show valid, safe moves
        moveoptions: function (selectedpiece) {
            // Clear old highlights
            if (main.variables.highlighted.length != 0) main.methods.togglehighlight(main.variables.highlighted);

            let rawMoves = main.methods.getRawOptions(selectedpiece);
            // Filter raw geometric moves through the Check Simulator
            let legalMoves = rawMoves.filter(coord => main.methods.isMoveLegal(selectedpiece, coord));

            main.variables.highlighted = legalMoves;
            main.methods.togglehighlight(legalMoves);
        },

        // Performs the physical move, handles captures, updates state, and generates PGN
        executeMove: function (target) {
            let selectedpiece = main.variables.selectedpiece;
            let pieceObj = main.variables.pieces[$('#' + selectedpiece).attr('chess')];
            let isDoubleJump = false;
            let color = pieceObj.type.slice(0,1);
            let isCapture = false;

            // 1. Castling Execution (Move the Rook; King moves normally below)
            if (pieceObj.type.includes('king') && Math.abs(parseInt(target.id.split('_')[0]) - parseInt(selectedpiece.split('_')[0])) > 1) {
                let rank = color === 'w' ? '1' : '8';
                let isKingside = target.id == '7_' + rank;
                let rookName = color + '_rook' + (isKingside ? '2' : '1');
                main.variables.pieces[rookName].position = isKingside ? '6_' + rank : '4_' + rank;
                main.variables.pieces[rookName].moved = true;
            }

            // 2. En Passant Execution (Capture the ghost pawn behind the moving pawn)
            if (pieceObj.type.includes('pawn') && target.id.split('_')[0] !== selectedpiece.split('_')[0] && main.methods.getPieceAt(target.id) === 'null') {
                let capId = main.methods.getPieceAt(target.id.split('_')[0] + '_' + selectedpiece.split('_')[1]);
                if (capId !== 'null') main.variables.pieces[capId].captured = true;
                isCapture = true;
            }

            // 3. Regular Capture
            let targetPieceId = main.methods.getPieceAt(target.id);
            if (targetPieceId !== 'null') {
                main.variables.pieces[targetPieceId].captured = true;
                isCapture = true;
            }

            // 4. Generate PGN string before modifying object state
            let pgnMove = main.methods.getAlgebraic(pieceObj, selectedpiece, target.id, isCapture);
            if (pieceObj.type.includes('king') && Math.abs(parseInt(target.id.split('_')[0]) - parseInt(selectedpiece.split('_')[0])) > 1) {
                pgnMove = target.id.split('_')[0] == '7' ? 'O-O' : 'O-O-O'; // Override with Castling notation
            }

            // 5. Draw Tracker & History Logging
            if (pieceObj.type.includes('pawn') || isCapture) main.variables.moveCountSinceEvent = 0;
            else main.variables.moveCountSinceEvent++;
            main.variables.history.push(JSON.stringify(main.variables.pieces));

            // 6. Pawn Specifics (Double Jump Track & Promotion)
            if (pieceObj.type.includes('pawn')) {
                let startY = parseInt(selectedpiece.split('_')[1]);
                let endY = parseInt(target.id.split('_')[1]);
                if (Math.abs(startY - endY) === 2) isDoubleJump = true;
                
                // Native UI Prompt for Promotion
                if (endY === 8 || endY === 1) {
                    let promo = prompt("Promote Pawn to: \nQ = Queen\nR = Rook\nB = Bishop\nN = Knight", "Q").toUpperCase();
                    let types = { 'Q': 'queen', 'R': 'rook', 'B': 'bishop', 'N': 'knight' };
                    let imgs = color === 'w' ? {'Q':'&#9813;','R':'&#9814;','B':'&#9815;','N':'&#9816;'} : {'Q':'&#9819;','R':'&#9820;','B':'&#9821;','N':'&#9822;'};
                    promo = types[promo] ? promo : 'Q'; 
                    pieceObj.type = color + '_' + types[promo];
                    pieceObj.img = imgs[promo];
                    pgnMove += "=" + promo; // Add promotion to PGN string
                }
            }

            // 7. Inject PGN string into Sidebar
            if (color === 'w') {
                main.variables.pgnHistory.push(`<span class="move-num">${main.variables.moveNumber}.</span> <span class="white-move">${pgnMove}</span> `);
            } else {
                main.variables.pgnHistory[main.variables.pgnHistory.length - 1] += `<span class="black-move">${pgnMove}</span><br>`;
                main.variables.moveNumber++;
            }
            $('#pgn-list').html(main.variables.pgnHistory.join(''));
            $('#pgn-list').scrollTop($('#pgn-list')[0].scrollHeight); // Auto-scroll to bottom

            // 8. Finalize Object State
            pieceObj.position = target.id;
            pieceObj.moved = true;
            main.variables.lastMove = { piece: $('#' + selectedpiece).attr('chess'), startId: selectedpiece, targetId: target.id, isDoubleJump: isDoubleJump };

            // 9. Re-render visual UI based on updated state
            main.methods.gamesetup();
            main.methods.updateGraveyard();
        },

        // Analyzes board state to dictate how to end the turn (Checks, Checkmates, Draws)
        endturn: function () {
            // Swap turns
            main.variables.turn = main.variables.turn == 'w' ? 'b' : 'w';
            
            // Wipe UI highlights
            main.methods.togglehighlight(main.variables.highlighted);
            main.variables.highlighted.length = 0;
            main.variables.selectedpiece = '';

            let uiTurnBox = $('#turn');
            uiTurnBox.removeClass('turnhighlight check-alert checkmate-alert stalemate-alert');

            // 1. Check for FIDE Draws
            let drawMessage = main.methods.isDraw();
            if (drawMessage) {
                uiTurnBox.html(drawMessage).addClass('stalemate-alert');
                clearInterval(main.variables.timerInterval); return;
            }

            // 2. Scan entire board to see if the next player has ANY legal moves left
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

            // 3. Process Checkmate vs Stalemate vs Check
            if (!hasLegalMoves) {
                clearInterval(main.variables.timerInterval); // Stop clock
                if (main.methods.isKingInCheck(main.variables.turn)) {
                    uiTurnBox.html("CHECKMATE! " + (main.variables.turn == 'w' ? "Black" : "White") + " Wins!").addClass('checkmate-alert');
                } else {
                    uiTurnBox.html("STALEMATE! It's a draw.").addClass('stalemate-alert');
                }
            } else {
                if (main.methods.isKingInCheck(main.variables.turn)) {
                    uiTurnBox.html("CHECK! " + (main.variables.turn == 'w' ? "White" : "Black") + " to move.").addClass('check-alert');
                } else {
                    uiTurnBox.html("It's " + (main.variables.turn == 'w' ? "White's" : "Black's") + " Turn!").addClass('turnhighlight');
                    window.setTimeout(() => uiTurnBox.removeClass('turnhighlight'), 1500); // Remove green flash after 1.5s
                }
                main.methods.startTimer(); // Start the next player's clock
            }
        },
        pauseGame: function() {
            if (main.variables.timerInterval) {
                clearInterval(main.variables.timerInterval);
                main.variables.timerInterval = null;
                $('#pause-btn').text('Resume');
                $('#pause-overlay').css('display', 'flex');
                $('.gamecell').css('pointer-events', 'none');
            } else {
                main.methods.startTimer();
                $('#pause-btn').text('Pause');
                $('#pause-overlay').css('display', 'none');
                $('.gamecell').css('pointer-events', 'auto');
            }
        },
        resetGame: function() {
            location.reload(); 
        },
    }
};

// --- INITIALIZATION & EVENT LISTENERS ---
$(document).ready(function () {
    main.methods.gamesetup();
    main.methods.updateClockUI(); // Show 05:00 initially

    // Flip Board Button Listener
    $('#flip-board-btn').click(function() {
        $('#game').toggleClass('flipped');
        
        const headers = $('.player-header');
        $(headers[0]).insertAfter('#game');
        $(headers[1]).insertBefore('#game');
    });

    // Board Click Listener (The core interaction)
    $('.gamecell').click(function (e) {
        var clickedPieceId = $(this).attr('chess');
        var clickedCellId = e.target.id;

        // 1. Select a piece to move
        if (main.variables.selectedpiece == '' && clickedPieceId != 'null' && clickedPieceId.slice(0, 1) == main.variables.turn) {
            main.variables.selectedpiece = clickedCellId;
            main.methods.moveoptions(clickedPieceId);
            if (!main.variables.timerInterval) main.methods.startTimer(); // Start clock on very first click of the game
        } 
        // 2. Execute a valid move (clicked a green highlighted square)
        else if (main.variables.selectedpiece != '' && main.variables.highlighted.includes(clickedCellId)) {
            main.methods.executeMove({id: clickedCellId});
            main.methods.endturn();
        } 
        // 3. Change selected piece (clicked another piece of own color)
        else if (main.variables.selectedpiece != '' && clickedPieceId != 'null' && clickedPieceId.slice(0, 1) == main.variables.turn) {
            main.methods.togglehighlight(main.variables.highlighted);
            main.variables.highlighted.length = 0;
            main.variables.selectedpiece = clickedCellId;
            main.methods.moveoptions(clickedPieceId);
        }
        // 4. Deselect (clicked a blank square or enemy piece that is not a valid move)
        else if (main.variables.selectedpiece != '') {
            main.methods.togglehighlight(main.variables.highlighted);
            main.variables.highlighted.length = 0;
            main.variables.selectedpiece = '';
        }
    });

    // Prevent standard right-click menu on the board
    $('body').contextmenu(function (e) { e.preventDefault(); });

    // Pause and Reset Button Listeners
    $('#pause-btn').click(function() {
        main.methods.pauseGame();
    });
    $('#reset-btn').click(function() {
        main.methods.resetGame();
    });
});
