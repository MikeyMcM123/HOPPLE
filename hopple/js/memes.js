/* Authored caption bank, selected by the puzzle's UTC date. No remote service. */
const WinMemes = {
  overrides : {
    '2026-11-11': {
      top:'When the toilet water',
      bottom: 'splashes back',
      image: 'assets/frog-meme.png',
    },
  },
  daily: [
    ['WHEN I NEED TO PAY TAXES', "BUT I'M A FROG"],
    ['WHEN YOU THINK YOU CAN FLY', "BUT YOU'RE A FROG"],
    ['MY PLANS FOR TONIGHT', 'SIT SOMEWHERE DAMP'],
    ['ME WHEN:', "IT'S WEDNESDAY"],
    ['WHEN SOMEONE SAYS TOUCH GRASS', 'WAY AHEAD OF YOU'],
    ['I HAVE A LOT ON MY PLATE', 'MOSTLY FLIES'],
    ['ME AFTER ONE EMAIL', 'BACK TO THE POND'],
    ['WHEN THE BILL ARRIVES', 'I THOUGHT THIS WAS A POND'],
    ['WHEN THEY ASK WHAT I BRING TO THE TABLE', 'A BUG'],
    ['WHEN MY ALARM GOES OFF', 'THAT SOUNDS LIKE A LAND PROBLEM'],
    ['ME CHECKING MY BANK ACCOUNT', 'STILL A FROG'],
    ['WHEN SOMEONE ASKS IF I HAVE PLANS', 'YES. THIS ROCK.'],
    ['WHEN IT STARTS RAINING', 'FINALLY, SOME GOOD WEATHER'],
    ['WHEN THE GROUP CHAT MAKES PLANS', 'CAN WE MEET AT MY POND'],
    ['ME AFTER MAKING ONE PHONE CALL', 'THAT IS ENOUGH FOR TODAY'],
    ['WHEN I GET DRESSED UP', 'SAME FROG. DIFFERENT COAT.'],
    ['WHEN THE DOOR SAYS PUSH', 'I HAVE VERY SMALL ARMS'],
    ['WHEN SOMEONE ASKS HOW I SLEPT', 'ON A LEAF'],
    ['WHEN MY FOOD FLIES AWAY', 'THAT WAS MY LUNCH'],
    ['WHEN THEY SAY THE MEETING IS OPTIONAL', 'RIBBIT'],
    ['MY FIVE YEAR PLAN', 'BIGGER POND'],
    ['WHEN I OPEN THE FRIDGE AGAIN', 'STILL NO FLIES'],
    ['WHEN SOMEONE TAKES MY SEAT', 'THAT WAS MY LILY PAD'],
    ['WHEN THE SUN COMES OUT', 'TIME TO SIT ON A DIFFERENT ROCK'],
    ['WHEN THEY ASK FOR MY QUALIFICATIONS', 'I CAN JUMP'],
    ['WHEN I FINISH ONE SMALL TASK', 'I DESERVE A BUG'],
    ['WHEN SOMEONE SAYS LONG TIME NO SEE', 'I WAS UNDER A ROCK'],
    ['ME TRYING TO ACT NORMAL', 'RIBBIT'],
    ['WHEN I HEAR THERE WILL BE SNACKS', 'WHAT KIND OF BUGS'],
    ['WHEN THEY ASK IF I WORK OUT', 'I HOP SOMETIMES'],
    ['WHEN I FORGET WHY I ENTERED A ROOM', 'WHY AM I EVEN IN A ROOM'],
    ['WHEN SOMEONE WAVES AT ME', 'WAS THAT A FLY'],
    ['WHEN I TRY TO SAVE MONEY', 'THE BUG WAS FREE'],
    ['WHEN THEY SAY DRESS FOR THE JOB YOU WANT', 'POND OWNER'],
    ['WHEN I HAVE TO INTRODUCE MYSELF', 'HELLO. FROG.'],
    ['WHEN I GET HOME EARLY', 'MORE TIME TO SIT'],
    ['WHEN SOMEONE ASKS WHAT I DO FOR FUN', 'SMALL JUMPS'],
    ['WHEN THEY SAY TAKE A SEAT', 'DO YOU HAVE A WET ONE'],
    ['ME READING THE MENU', 'WHERE ARE THE BUGS'],
    ['WHEN I HEAR A WEIRD NOISE', 'OH. THAT WAS ME.'],
    ['WHEN SOMEONE ASKS FOR DIRECTIONS', 'POND'],
    ['WHEN THEY TELL ME TO STAND UP STRAIGHT', 'THIS IS HOW I CAME'],
    ['WHEN THE WEATHER APP SAYS RAIN', 'FIVE STARS'],
    ['WHEN I TRY TO LOOK BUSY', 'LOOKING AT THIS LEAF'],
    ['WHEN SOMEONE ASKS IF I NEED ANYTHING', 'A SMALLER CHAIR'],
    ['WHEN IT IS TIME TO GO OUTSIDE', 'I AM ALREADY OUTSIDE'],
    ['WHEN I FIND A GOOD ROCK', 'CANCEL MY APPOINTMENTS'],
    ['WHEN MY FRIEND SAYS JUST ONE MORE GAME', 'ONE MORE HOP'],
    ['WHEN I FINALLY REMEMBER A WORD', 'I WOULD LIKE A BUG NOW'],
    ['WHEN THEY ASK IF I AM LISTENING', 'SORRY. FLY.'],
    ['ME ON A DAY OFF', 'EXACTLY THE SAME FROG'],
    ['WHEN MY PLANS GET CANCELLED', 'BACK TO DOING NOTHING'],
    ['WHEN I TRY TO REACH THE TOP SHELF', 'A SMALL JUMP WAS NOT ENOUGH'],
    ['WHEN SOMEONE CALLS ME DOWN TO EARTH', 'I WAS ALREADY HERE'],
    ['WHEN THE CAMERA TURNS ON', 'THIS IS MY GOOD SIDE'],
    ['WHEN I FIND MYSELF IN A SUIT', 'THIS POND HAS A DRESS CODE'],
    ['WHEN THEY ASK WHAT TIME I WILL ARRIVE', 'DEPENDS HOW MANY HOPS'],
    ['WHEN I GET A COMPLIMENT', 'THANK YOU. I GREW THESE LEGS MYSELF.'],
    ['WHEN SOMEONE ASKS IF I HAVE CHANGED', 'I USED TO BE A TADPOLE'],
    ['WHEN I HEAR THE WORD WEEKEND', 'I COULD SIT FOR TWO WHOLE DAYS'],
    ['WHEN I WALK INTO THE WRONG ROOM', 'THIS IS NOT THE POND'],
    ['WHEN MY FRIEND SAYS BE HONEST', 'I ATE THE FLY'],
    ['WHEN THEY ASK HOW THE DIET IS GOING', 'ANOTHER BUG'],
    ['WHEN THEY ASK ME TO FOLLOW MY DREAMS', 'THEY ARE MOSTLY ABOUT BUGS'],
    ['WHEN I TRY TO MAKE SMALL TALK', 'NICE POND'],
    ['WHEN SOMEONE KNOCKS ON MY DOOR', 'HOW DID YOU FIND THIS POND'],
    ['WHEN I HAVE NOTHING TO SAY', 'RIBBIT WILL DO'],
    ['WHEN SOMEONE ASKS WHAT I AM THINKING', 'THAT BUG OVER THERE'],
    ['WHEN THEY SAY WE NEED TO TALK', 'CAN I BRING MY LEAF'],
    ['WHEN I FINISH THE DAILY', 'BACK TO FROG BUSINESS']
  ],
  forDate(mode, dateKey) {
    const day = Date.parse(dateKey + 'T00:00:00Z');
    if (!Number.isFinite(day)) throw new Error('Invalid meme date');
    if (mode === 'daily') {
      const epoch = Date.UTC(2026, 10, 8);
      const index = ((Math.floor((day - epoch) / 86400000) % this.daily.length) + this.daily.length) % this.daily.length;
      const [top, bottom] = this.daily[index];
      return { top, bottom, reference:false, image:'assets/frog-meme.png' };
    }
    const weekday = new Date(day).getUTCDay();
    const top = 'IT IS MY PLEASURE TO INFORM YOU';
    const bottom = weekday === 0 ? 'IT IS SUNDAY' : weekday === 6 ? 'IT IS SATURDAY' : weekday === 5 ? 'IT IS FRIDAY' : weekday === 4 ? 'TOMORROW IS FRIDAY' : (5 - weekday) + ' DAYS UNTIL FRIDAY';
    // Use live text on the blank portrait on every day, including Thursday.
    return { top, bottom, reference:false, image:'assets/frog-meme.png' };
  },
  render(mode, dateKey, revealed = false) {
    const figure = document.getElementById('win-meme');
    if (!figure) return;
    figure.hidden = revealed;
    if (revealed) return;
    let meme;
    try { meme = this.forDate(mode, dateKey); } catch { figure.hidden = true; return; }
    const picture = document.getElementById('win-meme-image');
    picture.src = meme.image;
    figure.classList.toggle('is-reference', meme.reference);
    figure.setAttribute('aria-label', meme.top + '. ' + meme.bottom);
    document.getElementById('win-meme-top').textContent = meme.reference ? '' : meme.top;
    document.getElementById('win-meme-bottom').textContent = meme.reference ? '' : meme.bottom;
  }
};
if (typeof module !== 'undefined') module.exports = WinMemes;
