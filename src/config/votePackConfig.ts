export interface VotePackDefinition {
  type: 'basic' | 'art_lover' | 'pro' | 'expert' | 'elite';
  votes: number;
  votePower: number;
  description: string;
}

export const VOTE_PACK_DEFINITIONS: VotePackDefinition[] = [
  {
    type: 'basic',
    votes: 10,
    votePower: 1,
    description: 'Good for casual voters - 1 SLN per vote',
  },
  {
    type: 'art_lover',
    votes: 100,
    votePower: 1,
    description: 'Perfect for art enthusiasts - 1 SLN per vote',
  },
  {
    type: 'pro',
    votes: 25,
    votePower: 2,
    description: 'Enhanced voting power - 2 SLN per vote',
  },
  {
    type: 'expert',
    votes: 30,
    votePower: 5,
    description: 'For serious collectors - 5 SLN per vote',
  },
  {
    type: 'elite',
    votes: 50,
    votePower: 10,
    description: 'Maximum impact voting - 10 SLN per vote',
  },
];

export const calculatePackPrice = (votes: number, votePower: number): number => {
  return votes * votePower;
}; 