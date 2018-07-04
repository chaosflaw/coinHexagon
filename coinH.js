var gridArray = [
	[false,false,false,false,false,false,false],
		[false,false,false,false,false,false,false],
	[false,false,true ,true ,true ,false,false],
		[false,false,true ,true ,true ,false,false],
	[false,false,false,false,false,false,false],
		[false,false,false,false,false,false,false]
];
var counter = 0;
var timeouts = []; //used for the solution function; don't clear the rules window timeouts! It could leave it with opacity: 0 but visibility on, blocking 

$(document).ready(() => {
	footerClickEvents();
	reset();
	redraw();
	boardClickEvents();
});

//clicking anywhere on the page that is not a link will close the rules window
$(document).on('click', (e) => {
	if ($('.rules').css('visibility') == 'visible') {
		if (e.target.tagName.toLowerCase() != ('a')) {
			$('.rules').css('opacity','0');
			setTimeout(() => {
				$('.rules').css('visibility','hidden');
			}, 500);
		}
	}
});

function footerClickEvents() {
	$('#reset').on('click', function(){
		reset();
		redraw();
		boardClickEvents();
	});
	$('#solution').on('click',function(){
		if ($('#solution').html() == 'are you sure?' || $('#solution').html() == 'show again') {
				solution();
				$('#solution').html('show again');
		} else {
			$('#solution').html('are you sure?');
		}
	});
	$('#rules').on('click', function(){
		if ($('.rules').css('visibility') == 'hidden') {
			$('.rules').css('visibility','visible');
			$('.rules').css('opacity','1');	
		} else {
			$('.rules').css('opacity','0');
			setTimeout(() => {
				$('.rules').css('visibility','hidden');
			}, 500);
		}
	});
}

function boardClickEvents() {
	$('.active').on('click', function() {
		let r = parseInt(this.id.charAt(0)), c = parseInt(this.id.charAt(1));
		if (checkSurroundings(r,c) <= 4) {
			redraw();
			boardClickEvents();
		$(`#${r}${c}`).addClass('selected');
		gridArray[r][c] = false;
		for (let row = 0; row < 6; row++){
			for (let col = 0; col < 7; col++){
				//If false, not selected AND surrounded by 2-4 coins, add .destination
				if (!gridArray[row][col]){
					if (checkSurroundings(row,col) >= 2 && checkSurroundings(row,col) <= 4) {
						if (!(row == r && col == c)){
							$(`#${row}${col}`).addClass('destination');
						}
					}
				}
			}
		}
		gridArray[r][c] = true;
		destClickEvent(r,c);
		}
	});
}

function destClickEvent(r,c){
	$('.destination').one('click', function(){
		let Dr = parseInt(this.id.charAt(0)), Dc = parseInt(this.id.charAt(1));
		moveCoin(r,c,Dr,Dc);
		$(`#${r}${c}`).off('click');
	});
}

//Deactivate source -> Check move validity -> If valid, move and redraw the board; if not, reactivate source.
function moveCoin(Sr,Sc,Dr,Dc) {
	gridArray[Sr][Sc] = false;
	let surround = checkSurroundings(Dr,Dc);
	if (surround >= 2 && surround <=4 ) {
		gridArray[Dr][Dc] = true;
		counter++;
		redraw();
		boardClickEvents();
	} else { 
		gridArray[Sr][Sc] = true; 
	}
	if (winCondition(Dr,Dc)) {
		$('.active').addClass('win');
		$('.active').off('click');
	}
}

// Count number of active coins surrounding the given coordinates
// Due to how the array is mapped onto the hexagonal grid, even and odd rows can't be checked the same way; for example, if checking (1,2) you would look up (0,2),(0,3),(2,2),(2,3) [middle row irrelevant]
// for (2,2), however, that would result in checking at an offset; instead, you would have to look at (1,1),(1,2),(3,1),(3,2)
// There is a 'c' variable common to both cases [in (0,2) (0,3), (1,1) (1,2) for example, c == 2 is the common check.]
// This allows the following expression to be used in place of a separate if...else for even and odd rows:
// ( c - 1 + (2 * (r % 2)) )
// Start with (c - 1), which corresponds to even rows. If r is even, then (r % 2) == 0 and the expression evaluates to (c - 1).
// If r is odd, (r % 2) == 1 and the expression evaluates to (c + 1).

// Maybe this expression should be made into its own function?
function checkSurroundings(r,c){
	let count = 0;
	let cLength = gridArray[0].length - 1, rLength = gridArray.length - 1;
	let cExpression = (c - 1) + (2 * (r % 2));

	if (r>0){
		if (gridArray[r-1][c]) {count++;} 			//top row, common c
		if (gridArray[r-1][cExpression]) {count++;} //top row w/ even-odd check	
	}
	if (r<rLength) {
		if (gridArray[r+1][c]) {count++;} 			//bot row common c	
		if (gridArray[r+1][cExpression]) {count++;} //bot row w/ even-odd check
	}
	if (c>0){
		if (gridArray[r][c-1]) {count++;} 			//mid row left
	}
	if (c<cLength) {
		if (gridArray[r][c+1]) {count++;} 			//mid row right		
	}
	return count;
}

// Given (r,c) coordinates, for every inactive coin around those coordinates, check if it is the center of a hexagon (checkSurroundings returns 6). If so, return true.
// This is done to avoid having to check the whole board for the win condition: every time a move is made, we can look around the destination for the center of the hexagon, cutting back considerably on the number of coins we have to verify.
// Like before, different rules for checking even and odd rows apply.
// the try...catch block isn't exactly good practice as it does no error handling at all
// but there is currently no actual need to handle the exceptions caused by the lack of border checking on the winCondition function

// CAUTION: If this function is ever used in a more general sense, it should (probably) be modified to include border checks! Unforeseen consequences, Mr. Freeman.
function winCondition(r,c) {
	let cExpression = (c - 1) + (2 * (r % 2));
	try {
		if (!gridArray[r-1][c]) { 			//top r, common c
			if (checkSurroundings(r-1,c) == 6) { return true;}
		}
		if (!gridArray[r-1][cExpression]) { //top r, even/odd check
			if (checkSurroundings(r-1,c-1) == 6) { return true;}
		}

		if (!gridArray[r][c-1]) { 			//mid row left
				if (checkSurroundings(r,c-1) == 6) { return true;}
		}
		if (!gridArray[r][c+1]) { 			//mid row right
				if (checkSurroundings(r,c+1) == 6) { return true;}
		}

		if (!gridArray[r+1][c]) { 			//bot r, common c
				if (checkSurroundings(r+1,c) == 6) { return true;}
		}
		if (!gridArray[r+1][cExpression]) {	// bot r, even/odd check
			if (checkSurroundings(r+1,c-1) == 6) { return true;}
		}
	}
	catch {}
	return false;
}

function reset() {
	for (let i = 0;i < timeouts.length;i++){ //clear solution() moveCoin timers
		clearTimeout(timeouts[i]);
	}
	//fill array with false values, then activate the six starting coins and reset the move counter
	for (let r = 0; r < gridArray.length; r++) {
		gridArray[r].fill(false);
	}
	gridArray[2].fill(true,2,5);
	gridArray[3].fill(true,2,5);
	counter = 0;	
}

function redraw() {
	for (let r = 0; r < gridArray.length; r++) {
		for (let c = 0; c < gridArray[0].length; c++) {
			let currCoin = document.getElementById(`${r}${c}`);
			currCoin.className = "gridCoinIn";
			$('.gridCoinIn').off();
			if (gridArray[r][c]) {
				$(`#${r}${c}`).addClass('active');
			}
		}
	}
	$('#counter').html(counter);
}

//the coordinates here can be generalised, if the need ever arises, taking just a single coordinate (for the top-left coin)
function solution() {
	reset();
	redraw();
	timeouts.push(setTimeout(() => {moveCoin(3,2,4,4)}, 1000));
	timeouts.push(setTimeout(() => {moveCoin(3,3,3,2)}, 2000));
	timeouts.push(setTimeout(() => {moveCoin(2,2,4,3)}, 3000));
}