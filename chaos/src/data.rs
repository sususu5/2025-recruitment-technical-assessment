use axum::{http::StatusCode, response::IntoResponse, Json};
use serde::{Deserialize, Serialize};

pub async fn process_data(Json(request): Json<DataRequest>) -> impl IntoResponse {
    let mut string_len = 0;
    let mut int_sum = 0;

    for item in request.data {
        match item {
            serde_json::Value::String(s) => {
                string_len += s.len();
            }
            serde_json::Value::Number(n) => {
                int_sum += i;
            }
            _ => {}
        }
    }

    let response = DataResponse {
        string_len,
        int_sum,
    };

    (StatusCode::OK, Json(response))
}

#[derive(Deserialize)]
pub struct DataRequest {
    data: Vec<serde_json::Value>,
}

#[derive(Serialize)]
pub struct DataResponse {
    string_len: usize,
    int_sum: i64,
}
