/* end.js - End screen behavior and display logic
   - Reads final game result from localStorage (key: 'endState').
   - Renders title, summary, and any badges earned during the run.
   - Provides a restart button that returns the player to the start page.
*/

/* UI elements:
   endTitle    - element for the large result title (win/lose emoji + text)
   endMessage  - element for a short summary (credits, range, short message)
   endBadges   - container where earned badges will be shown
   btnRestart  - button that navigates back to the start page
*/
const endTitle = document.getElementById('end-title');
const endMessage = document.getElementById('end-message');
const endBadges = document.getElementById('end-badges');
const btnRestart = document.getElementById('btnRestart');

// Load end info from localStorage. The stored object should be under 'endState'.
// Fall back to an empty object if the key is missing or invalid.
const END_STATE = JSON.parse(localStorage.getItem('endState')||'{}');

// Render the primary end result. The stored structure is expected to contain a boolean 'win'
// and numeric 'credits' and 'range' values. Update the textual title and message accordingly.
if(END_STATE.win){
  endTitle.textContent = '🎉 You Won!';
  endMessage.innerHTML = `<p>Collected all shards & fuel!</p><p>Credits: ${END_STATE.credits}, Range: ${END_STATE.range}</p>`;
} else {
  endTitle.textContent = '💀 You Lost';
  endMessage.innerHTML = `<p>Better luck next time!</p><p>Credits: ${END_STATE.credits}, Range: ${END_STATE.range}</p>`;
}

// If the run produced badges, display them in the end screen.
// Each badge object is expected to have 'name' and 'desc' properties.
// Create a small visual element per badge and add a tooltip/title for details.
if(END_STATE.badges && END_STATE.badges.length>0){
  END_STATE.badges.forEach(b=>{
    const div = document.createElement('div');
    div.className='badge';
    div.textContent=b.name;
    div.title=b.desc;
    endBadges.appendChild(div);
  });
}

// Restart button: navigate back to the start page to allow a new session.
btnRestart.addEventListener('click', ()=>{
  window.location.href='/start';
});