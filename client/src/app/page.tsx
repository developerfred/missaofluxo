'use client'
import React, { useState, useEffect } from 'react';
import { Scroll, MapPin, Sword, Shield, Coins, Heart, Award, Zap, UserPlus, Users } from 'lucide-react';

const MissaoFluxo = () => {
  const [gameState, setGameState] = useState({
    player: {
      name: 'Aventureiro',
      level: 1,
      hp: 100,
      maxHp: 100,
      exp: 0,
      skills: ['Ataque Básico'],
      tokenStream: 1,
    },
    location: 'Acampamento Base',
    messages: ['As montanhas congeladas estão derretendo. Um antigo portal para o submundo se abriu após séculos.'],
    inventory: [],
    guild: null,
  });

  const locations = {
    'Acampamento Base': {
      description: 'Um refúgio seguro nas terras baixas. Daqui você pode ver as montanhas derretendo.',
      options: ['Explorar Montanhas', 'Treinar Habilidades', 'Gerenciar Fluxos', 'Descansar'],
    },
    'Montanhas': {
      description: 'As encostas escorregadias das montanhas em degelo. O ar fica mais frio conforme você sobe.',
      options: ['Procurar Portal', 'Lutar contra Monstro', 'Voltar ao Acampamento'],
    },
    'Portal': {
      description: 'Um portal antigo e misterioso, recentemente exposto pelo degelo. Energias estranhas emanam dele.',
      options: ['Entrar no Portal', 'Voltar às Montanhas'],
    },
  };

  const addMessage = (message) => {
    setGameState(prev => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  };

  const handleAction = (action) => {
    switch (action) {
      case 'Explorar Montanhas':
        setGameState(prev => ({ ...prev, location: 'Montanhas' }));
        addMessage('Você começa a subir as montanhas escorregadias.');
        break;
      case 'Treinar Habilidades':
        const newSkill = `Habilidade Nível ${gameState.player.level}`;
        setGameState(prev => ({
          ...prev,
          player: {
            ...prev.player,
            skills: [...prev.player.skills, newSkill],
            exp: prev.player.exp + 10,
          }
        }));
        addMessage(`Você treinou e aprendeu ${newSkill}!`);
        checkLevelUp();
        break;
      case 'Gerenciar Fluxos':
        setGameState(prev => ({
          ...prev,
          player: { ...prev.player, tokenStream: prev.player.tokenStream + 1 }
        }));
        addMessage('Você aumentou seu fluxo de tokens.');
        break;
      case 'Descansar':
        setGameState(prev => ({
          ...prev,
          player: { ...prev.player, hp: prev.player.maxHp }
        }));
        addMessage('Você descansou e recuperou toda sua energia.');
        break;
      case 'Lutar contra Monstro':
        fightMonster();
        break;
      case 'Procurar Portal':
        if (Math.random() > 0.5) {
          setGameState(prev => ({ ...prev, location: 'Portal' }));
          addMessage('Você encontrou o portal misterioso!');
        } else {
          addMessage('Você procurou, mas não encontrou o portal desta vez.');
        }
        break;
      case 'Voltar ao Acampamento':
        setGameState(prev => ({ ...prev, location: 'Acampamento Base' }));
        addMessage('Você retornou ao acampamento base em segurança.');
        break;
      case 'Voltar às Montanhas':
        setGameState(prev => ({ ...prev, location: 'Montanhas' }));
        addMessage('Você voltou para as montanhas.');
        break;
      case 'Entrar no Portal':
        addMessage('Você entra no portal. Uma nova aventura aguarda!');        
        break;
    }
  };

  const fightMonster = () => {
    const damage = Math.floor(Math.random() * 20) + 1;
    const expGain = Math.floor(Math.random() * 15) + 5;
    setGameState(prev => ({
      ...prev,
      player: {
        ...prev.player,
        hp: Math.max(0, prev.player.hp - damage),
        exp: prev.player.exp + expGain,
      }
    }));
    addMessage(`Você lutou contra um monstro! Tomou ${damage} de dano e ganhou ${expGain} de experiência.`);
    checkLevelUp();
  };

  const checkLevelUp = () => {
    if (gameState.player.exp >= gameState.player.level * 100) {
      setGameState(prev => ({
        ...prev,
        player: {
          ...prev.player,
          level: prev.player.level + 1,
          maxHp: prev.player.maxHp + 20,
          hp: prev.player.maxHp + 20,
          exp: 0,
        }
      }));
      addMessage(`Parabéns! Você subiu para o nível ${gameState.player.level + 1}!`);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setGameState(prev => ({
        ...prev,
        player: {
          ...prev.player,
          hp: Math.min(prev.player.maxHp, prev.player.hp + prev.player.tokenStream),
        }
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-amber-100 p-4 font-serif">
      <div className="flex justify-between mb-4 border-b-2 border-amber-500 pb-2">
        <div className="text-2xl font-bold"><Scroll className="inline mr-2" /> MissãoFluxo</div>
        <div className="text-xl"><MapPin className="inline mr-2" /> {gameState.location}</div>
      </div>

      <div className="flex-grow flex">
        <div className="w-3/4 pr-4">
          <div className="bg-gray-800 p-4 rounded-lg mb-4 h-64 overflow-auto">
            {gameState.messages.map((msg, i) => <p key={i} className="mb-2">{msg}</p>)}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {locations[gameState.location].options.map(option => (
              <button
                key={option}
                onClick={() => handleAction(option)}
                className="bg-amber-700 text-amber-100 p-2 rounded hover:bg-amber-600 transition-colors"
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="w-1/4 bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xl mb-4 border-b border-amber-500 pb-2">Status do Jogador</h2>
          <div className="mb-2"><Sword className="inline mr-2" /> Nível: {gameState.player.level}</div>
          <div className="mb-2"><Heart className="inline mr-2" /> HP: {gameState.player.hp}/{gameState.player.maxHp}</div>
          <div className="mb-2"><Award className="inline mr-2" /> EXP: {gameState.player.exp}/{gameState.player.level * 100}</div>
          <div className="mb-2"><Coins className="inline mr-2" /> Fluxo: {gameState.player.tokenStream}/s</div>
          <h3 className="text-lg mt-4 mb-2">Habilidades:</h3>
          <ul>
            {gameState.player.skills.map((skill, index) => (
              <li key={index}><Zap className="inline mr-2" />{skill}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MissaoFluxo;