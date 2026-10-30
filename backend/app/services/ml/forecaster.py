import torch
import torch.nn as nn
from typing import Tuple

class BiLSTMStressForecaster(nn.Module):
    def __init__(self, input_dim: int = 6, hidden_dim: int = 32, num_layers: int = 1, horizon: int = 14):
        super().__init__()
        self.lstm = nn.LSTM(
            input_size=input_dim,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            bidirectional=True
        )
        self.fc_mean = nn.Linear(hidden_dim * 2, horizon)
        self.fc_var = nn.Linear(hidden_dim * 2, horizon)
        self.softplus = nn.Softplus()

    def forward(self, x: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        lstm_out, _ = self.lstm(x)
        context = lstm_out[:, -1, :]
        mu = self.fc_mean(context)
        sigma = self.softplus(self.fc_var(context)) + 1e-4
        return mu, sigma