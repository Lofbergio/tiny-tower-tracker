export interface Mission {
  id: string
  name: string
  description: string
  requirements: MissionRequirement[]
  reward: number
}

export interface MissionRequirement {
  product: string
  quantity: number
  store: string
}

export interface Store {
  id: string
  name: string
  category: string
  products: string[]
}

export interface UserStore {
  storeId: string
  residents: string[]
}

export interface Resident {
  id: string
  name: string
  dreamJob: string
  currentStore?: string
}

export interface UserMission {
  missionId: string
  status: 'pending' | 'completed'
  addedAt: number
}

export interface UserData {
  stores: UserStore[]
  residents: Resident[]
  missions: UserMission[]
}
