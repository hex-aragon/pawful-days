export const WORLD={width:2800,height:2000};
export const START={x:690,y:800};
export const spots=[
{id:'grandma',x:735,y:645,label:'꽃집 할머니',verb:'인사하기',type:'npc'},
{id:'bowl',x:520,y:755,label:'우리 집 밥그릇',verb:'밥 먹기',type:'bowl'},
{id:'bed',x:470,y:635,label:'포근한 우리 집',verb:'푹 쉬기',type:'home'},
{id:'ball',x:1260,y:1100,label:'초원의 공',verb:'공놀이 시작',type:'ball'},
{id:'picnic',x:1480,y:475,label:'햇살 쉼터',verb:'잠깐 쉬기',type:'picnic'},
{id:'friend',x:835,y:1510,label:'숲속 친구 두리',verb:'같이 놀기',type:'friend'},
{id:'lake',x:1910,y:1050,label:'반짝이는 호숫가',verb:'물소리 듣기',type:'lake'},
];
export const flowerSpots=[{x:875,y:875},{x:1080,y:970},{x:1360,y:880},{x:1480,y:1280},{x:950,y:1210},{x:620,y:1180},{x:585,y:1450},{x:930,y:1650},{x:1150,y:1590},{x:1590,y:680},{x:1780,y:490},{x:1830,y:1390}];
export const quests=[
{title:'세상에 첫 발자국',description:'집 앞 꽃집 할머니에게 인사해요.',target:'grandma',goal:1,reward:12,count:'할머니를 찾아 인사하기'},
{title:'모험 전, 든든한 한 끼',description:'집 앞 밥그릇을 찾아 밥을 먹어요.',target:'bowl',goal:1,reward:12,count:'우리 집 밥그릇 찾아가기'},
{title:'꽃향기를 따라',description:'초원을 걸으며 꽃 세 송이를 모아요.',target:'flower',goal:3,reward:24,count:'꽃 모으기'},
{title:'폴짝! 공을 따라가요',description:'초원의 공을 던지고 쫓아가 보세요.',target:'fetch',goal:1,reward:24,count:'공놀이 끝내기'},
{title:'숲속의 새 친구',description:'남쪽 숲에 사는 두리를 만나 보세요.',target:'friend',goal:1,reward:24,count:'두리와 인사하기'},
{title:'물이 반짝이는 곳',description:'동쪽 호숫가에서 잠시 쉬어 가요.',target:'lake',goal:1,reward:28,count:'호숫가 찾아가기'},
{title:'집으로 돌아가는 길',description:'우리 집으로 돌아와 푹 자요.',target:'bed',goal:1,reward:20,count:'집에서 하루 마무리하기'},
];
let seed=7391;function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
export const trees=[];for(let i=0;i<210;i++){const x=100+random()*2600,y=100+random()*1800;const path=Math.abs(y-790)<100||Math.abs(x-1100)<100||Math.abs(y-1430)<90||Math.abs(x-1750)<90;const safe=(x>1200&&x<1550&&y>980&&y<1200)||flowerSpots.some(f=>Math.hypot(f.x-x,f.y-y)<85)||spots.some(s=>Math.hypot(s.x-x,s.y-y)<165)||Math.hypot(x-START.x,y-START.y)<130;const pond=((x-2190)/440)**2+((y-1190)/360)**2<1;if(!safe&&!path&&!pond&&!(x>330&&x<690&&y>320&&y<760))trees.push({x,y,size:.75+random()*.6,tone:Math.floor(random()*3)})}
export const ground=[];for(let i=0;i<950;i++)ground.push({x:random()*2800,y:random()*2000,type:Math.floor(random()*7),size:random()});
export function blocked(x,y){if(x<65||y<85||x>2735||y>1935)return true;if(x>335&&x<635&&y>375&&y<607)return true;const pond=((x-2190)/329)**2+((y-1190)/247)**2<1;if(pond&&Math.abs(y-1190)>28)return true;return trees.some(t=>Math.hypot(t.x-x,t.y-y)<21*t.size+13)}
export function move(pos,dx,dy){const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/10));let x=pos.x,y=pos.y;for(let i=0;i<steps;i++){if(!blocked(x+dx/steps,y))x+=dx/steps;if(!blocked(x,y+dy/steps))y+=dy/steps}return{x,y}}
export const regionAt=(x,y)=>x>1790?'반짝 호수':y>1320?'바람 숲':x>1100&&y<650?'햇살 쉼터':x>950?'꽃바람 초원':'햇살 마을';
