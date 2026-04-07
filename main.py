import random
from collections import Counter

class LottoSimulator:
    def __init__(self):
        self.winning_numbers = []
        self.bonus_number = 0

    def generate_numbers(self):
        """1~45 중 중복 없이 6개 번호 생성"""
        return sorted(random.sample(range(1, 46), 6))

    def set_winning_numbers(self):
        """당첨 번호와 보너스 번호 설정"""
        numbers = random.sample(range(1, 46), 7)
        self.winning_numbers = sorted(numbers[:6])
        self.bonus_number = numbers[6]

    def check_rank(self, my_numbers):
        """당첨 등수 확인 로직"""
        match_count = len(set(my_numbers) & set(self.winning_numbers))
        
        if match_count == 6: return 1
        if match_count == 5 and self.bonus_number in my_numbers: return 2
        if match_count == 5: return 3
        if match_count == 4: return 4
        if match_count == 3: return 5
        return 0

    def run_simulation(self, iterations=1000):
        """지정한 횟수만큼 자동 구매 시뮬레이션"""
        self.set_winning_numbers()
        results = []
        
        for _ in range(iterations):
            my_nums = self.generate_numbers()
            results.append(self.check_rank(my_nums))
            
        return Counter(results)

if __name__ == "__main__":
    sim = LottoSimulator()
    print("🚀 로또 1등 당첨 시뮬레이션을 시작합니다 (100,000회 자동 구매)")
    
    counts = sim.run_simulation(100000)
    
    print("-" * 40)
    print(f"당첨 번호: {sim.winning_numbers} + 보너스: {sim.bonus_number}")
    print("-" * 40)
    for rank in range(1, 6):
        print(f"{rank}등 당첨 횟수: {counts.get(rank, 0)}회")
    print(f"낙첨 횟수: {counts.get(0, 0)}회")
    print("-" * 40)
