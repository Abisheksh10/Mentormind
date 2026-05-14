import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier

OUT_MODEL = "../models/gap_priority.pkl"

def main():
    # Synthetic training:
    # Inputs: [gap, importance, required]
    # Output: priority 0 low, 1 medium, 2 high
    X = []
    y = []

    for gap in range(0, 101, 5):
        for importance in [1.0, 1.5, 2.0, 2.5, 3.0]:
            for required in [20, 40, 60, 80, 100]:
                score = gap * importance + required * 0.2
                if score >= 140:
                    label = 2
                elif score >= 70:
                    label = 1
                else:
                    label = 0
                X.append([gap, importance, required])
                y.append(label)

    X = np.array(X, dtype=np.float32)
    y = np.array(y, dtype=np.int64)

    model = RandomForestClassifier(n_estimators=150, random_state=42)
    model.fit(X, y)

    joblib.dump(model, OUT_MODEL)
    print("✅ Saved:", OUT_MODEL)

if __name__ == "__main__":
    main()
