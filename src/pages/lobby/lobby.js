export function renderLobby() {
  return `
    <div class="header">
      <div class="header-bar">
        <div class="title">Looty</div>
        <div class="player-info">
          <span id="playerName">Guest_001</span>
          <span id="playerBalance">0 Coin</span>
        </div>
      </div>

      <div class="tabs" id="mainTabs">
        <div class="tab active" data-main="explore">全部</div>
        <div class="tab" data-main="games">遊戲</div>
        <div class="tab" data-main="casino">娛樂</div>
        <div class="tab" data-main="premium">限定</div>
        <div class="tab" data-main="live">直播</div>
      </div>

      <div class="tabs subtabs" id="casinoSubTabs">
        <div class="tab active" data-sub="slot">slot</div>
        <div class="tab" data-sub="fish">fish</div>
        <div class="tab" data-sub="card">card</div>
        <div class="tab" data-sub="arcade">arcade</div>
      </div>
    </div>

    <div class="content">
      <div class="grid" id="gameGrid"></div>
    </div>
  `;
}