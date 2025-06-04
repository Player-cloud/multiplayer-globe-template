const globeContainer = document.getElementById('globeViz');

const Globe = GlobeGL() // globe.gl instance
  (globeContainer)
  .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
  .backgroundColor('#000000');

// Initialize vote counts
const voteCounts = {
  yes: 0,
  no: 0,
  neutral: 0,
};

const countsEl = {
  yes: document.getElementById('count-yes'),
  no: document.getElementById('count-no'),
  neutral: document.getElementById('count-neutral'),
};

// Setup WebSocket connection to worker
const socket = new WebSocket(`wss://${location.host}/ws`);

socket.addEventListener('open', () => {
  console.log('WebSocket connected');
});

// Listen for messages: { type: 'update', counts: { yes, no, neutral } }
socket.addEventListener('message', event => {
  const data = JSON.parse(event.data);
  if (data.type === 'update') {
    Object.assign(voteCounts, data.counts);
    updateUI();
  }
});

function updateUI() {
  for (const key in voteCounts) {
    countsEl[key].textContent = voteCounts[key];
  }
}

// Handle vote buttons
document.querySelectorAll('#poll-ui button').forEach(button => {
  button.addEventListener('click', () => {
    const vote = button.getAttribute('data-vote');
    socket.send(JSON.stringify({ type: 'vote', vote }));
  });
});
