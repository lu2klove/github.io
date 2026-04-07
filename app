import streamlit as st
import random

# 웹 페이지 설정
st.set_page_config(page_title="로또 당첨 시뮬레이터", page_icon="🎰")

st.title("🎰 로또 번호 추출 및 시뮬레이터")
st.write("버튼을 누르면 행운의 번호를 생성하고 당첨 확률을 분석합니다.")

# 로또 번호 생성 함수
def get_lotto():
    return sorted(random.sample(range(1, 46), 6))

# 웹 화면 구성
if st.button("이번 주 번호 뽑기"):
    my_numbers = get_lotto()
    
    # 번호를 예쁜 디자인으로 출력
    cols = st.columns(6)
    for i, num in enumerate(my_numbers):
        cols[i].success(f"**{num}**")
        
    st.balloons() # 축하 효과
    st.info(f"선택된 번호: {my_numbers}")

# 추가 기능: 1,000번 자동 구매 시뮬레이션
if st.checkbox("1,000번 자동 구매 시뮬레이션 실행"):
    st.write("시뮬레이션 중...")
    # 여기에 기존에 만든 통계 로직을 넣으면 그래프로 바로 보여줄 수 있습니다.
