## RESEARCH PROJECT PROPOSAL

Topic 5

## Explainable Contrastive Learning for

## Digital Twin-Enabled Industrial Anomaly Detection

![Image](sem6el_artifacts/image_000000_14e196c7f078f66bc8d2845a9975e2ede32b2b8b235f058b9523f1c30e7f99a2.png)

## Target Venues

IEEE Transactions on Industrial Informatics  ·  Applied Soft Computing IEEE Internet of Things Journal  ·  Information Sciences

Industrial Control Systems Security  ·  Self-Supervised Learning  ·  Explainable AI

## 1. Executive Summary

## Project Overview

This  project  proposes  a  novel,  self-supervised  anomaly  detection  framework  for  Industrial Control Systems (ICS). The system combines Soft Contrastive Learning (SoftCLT) with Gramian Angular  Fields  (GAF)  image  encoding  and  a  Digital  Twin  architecture,  supplemented  by  an Explainable AI (XAI) layer using Grad-CAM and SHAP. The goal is to produce a low-false-positive, interpretable anomaly  detector that operators can trust for real-time, high-stakes shutdown decisions in critical infrastructure environments.

Industrial Control Systems underpin critical infrastructure worldwide - from water treatment plants to power grids and chemical facilities. These systems demand near-perfect reliability, extremely low false alarm rates, and, crucially, operator trust. Existing machine learning-based anomaly detection approaches fail on multiple fronts: they require labeled attack data that is rarely available, produce excessive false positives, and offer no interpretability to operators who must decide whether to halt an entire plant.

This  proposal  addresses  all  these gaps simultaneously through a carefully integrated pipeline of four  novel  technical  components:  (1)  SoftCLT-based  self-supervised  representation learning that preserves  temporal  structure,  (2)  a  Digital  Twin  architecture  that  models  and  monitors  normal system behavior, (3) GAF + CNN encoding that transforms multivariate sensor data into spatially rich  image  representations,  and  (4)  a  post-hoc  XAI  layer  that  delivers  actionable,  sensor-level explanations to operators.

## 2. Problem Statement

## 2.1 Domain Context

Industrial  Control  Systems  (ICS)  are  cyber-physical  systems  that  monitor  and  control  physical processes in critical infrastructure sectors. They integrate Supervisory Control and Data Acquisition (SCADA) systems, Programmable Logic Controllers (PLCs), and arrays of sensors and actuators to manage processes that are inherently continuous, temporally correlated, and safety-critical.

| Water Treatment Plants   | Manage chemical dosing, filtration stages, and pump operations. Anomalies can result in contaminated water supply affecting entire cities.   |
|--------------------------|----------------------------------------------------------------------------------------------------------------------------------------------|
| Power Grids              | Control generation, transmission, and distribution. Faults can cascade into widespread blackouts with massive economic and social cost.      |
| Manufacturing Lines      | Coordinate robotic assembly, quality control, and logistics. Downtime translates directly into financial loss.                               |
| Chemical Plants          | Regulate reaction temperatures, pressures, and flow rates. Anomalies can trigger hazardous chemical releases or explosions.                  |

## 2.2 Why Anomaly Detection Is Hard in ICS

Anomaly  detection  in  ICS  time-series  data  faces  compounding  challenges  that  standard  ML approaches cannot handle:

- Label Scarcity: Real attack data is extremely rare. Labeling attacks requires controlled experiments or forensic reconstruction, which is expensive and infeasible in production systems. Most datasets contain less than 10% labeled anomaly samples.
- High False Positive Cost: A false positive in ICS means an unnecessary plant shutdown costing tens of thousands of dollars per hour, endangering physical processes, and critically, eroding operator trust. Low FPR is a non-negotiable requirement.
- Black-Box Predictions: Even if a model detects an anomaly correctly, operators will not act on an unexplained alarm. Without knowing which sensor triggered the alert and during which time window, the detection is operationally useless.
- Temporal Complexity: ICS sensor readings exhibit strong temporal autocorrelation and inter-sensor dependencies. Standard contrastive learning methods destroy temporal order through random augmentation, losing precisely the signal that distinguishes normal operation from attack.
- Concept Drift: ICS systems undergo maintenance, seasonal variation, and configuration changes. A static model quickly becomes stale, increasing false alarms over time.

## 2.3 Failure Modes of Existing Approaches

| Approach           | Limitation 1               | Limitation 2                 | Limitation 3          |
|--------------------|----------------------------|------------------------------|-----------------------|
| Isolation Forest   | Ignores temporal structure | Poor on high-dim ICS data    | No explanations       |
| Standard LSTM      | Requires labeled attacks   | Poor generalization          | Uninterpretable       |
| CNN-based models   | No temporal augmentation   | Hard negative sampling fails | Static threshold only |
| TS2Vec / CARLA     | Hard contrastive loss      | Binary pair assignments      | No XAI layer          |
| Rule-based Systems | Needs expert encoding      | Cannot detect novel attacks  | High maintenance cost |

## 2.4 Core Problem Definition

## Formal Problem Statement

Given a multivariate time-series stream X = {x1, x2, ..., xT} from N sensors in an ICS, operating without any labeled attack data, learn a representation function f: X → Z such that: (1) anomalies

are  separable  in  the  latent  space  Z,  (2)  the  false  positive  rate  FPR  is  minimized  on  normal operational data, and (3) for every flagged anomaly, a human-interpretable explanation E(x, t) is generated identifying the contributing sensors and time intervals.

## 3. Research Gaps

## 3.1 Gap Analysis in Existing Literature

A  systematic  review  of  recent  literature  in  ICS  anomaly  detection,  self-supervised  time-series learning, and digital twin-based monitoring reveals five concrete, unaddressed gaps:

## Gap 1 - Temporal Destruction in Contrastive Learning

State-of-the-art contrastive learning frameworks such as TS2Vec and TNC rely on random cropping and jittering augmentations that inherently destroy the temporal ordering of sensor readings. In ICS environments,  anomalies  are  often  characterized  by  slow  drift,  delayed  actuator  response,  and multi-step attack sequences.  Randomly  permuting  time  windows  eliminates  this diagnostic information.  No  existing  framework  applies  soft,  temporally-aware  contrastive  objectives  to  ICS data.

## Gap 2 - Missing Digital Twin Integration with Representation Learning

Digital  twin  approaches  for  ICS  monitoring  have  been  proposed  in isolation, typically relying on physics-based models that require deep domain engineering and do not generalize across system configurations. No published work integrates a learned digital twin (driven by a latent-space encoder trained with contrastive loss) with a deviation-based anomaly scoring module. The combination of data-driven twin modeling with self-supervised representation learning is an open research problem.

## Gap 3 - Limited Multivariate Sensor Encoding for CNNs

Recurrent models dominate ICS time-series analysis, yet CNNs consistently outperform them when given appropriate input representations. Gramian Angular Fields (GAF) have demonstrated success in univariate time-series classification but have not been systematically extended to multivariate ICS sensor streams with explicit inter-channel correlation preservation. The question of how to compose multi-sensor GAF encodings for CNN-based anomaly detection remains unanswered.

## Gap 4 - Absence of Integrated XAI for ICS Anomaly Attribution

Published  ICS  anomaly  detection  systems  provide  binary  alarms  at  best.  While  SHAP  and Grad-CAM have been applied in general computer vision and tabular domains, their adaptation to anomaly  detection  on  GAF-encoded  ICS  signals - where the spatial dimensions correspond to temporal self-correlation - has not been studied. Operators need timestep-level and sensor-level attribution, not just anomaly scores.

## Gap 5 - Benchmark Gap with SoftCLT on ICS Datasets

SoftCLT  (Soft  Contrastive  Learning  for  Time  Series) was proposed as a general framework and benchmarked  on  generic  time-series  classification  tasks.  Its  application  to  anomaly  detection in safety-critical ICS environments - evaluated against established benchmarks like SWaT and WADI - has never been reported in the literature. This represents a direct and actionable research gap suitable for a Q1 publication.

## 3.2 Research Gap Summary Table

| Research Gap                           | Existing Works           | This Proposal's Contribution                     |
|----------------------------------------|--------------------------|--------------------------------------------------|
| Temporal destruction in CL             | TS2Vec, TNC, CARLA       | SoftCLT with temporal-aware soft assignments     |
| Digital twin + representation learning | Physics-based twins only | Learned latent-space twin with deviation scoring |
| Multivariate GAF for CNNs              | Univariate GAF only      | Multi-channel GAF with inter-sensor correlation  |
| XAI for ICS anomaly attribution        | Binary alarms only       | Grad-CAM + SHAP attribution pipeline             |
| SoftCLT on SWaT/WADI benchmarks        | Not benchmarked          | Full benchmark on SWaT and WADI                  |

## 4. Proposed Solution

## 4.1 Solution Overview

The  proposed  system,  XCDT-ICS  (eXplainable  Contrastive  Digital  Twin  for  Industrial  Control Systems),  is  a  self-supervised  anomaly  detection  framework  that  integrates  four  tightly  coupled components into a unified inference pipeline. It is trained exclusively on normal operational data and requires no attack labels.

## System Design Principle

Train  a  digital  twin  of  normal  ICS  behavior  using  soft  contrastive  representation  learning over GAF-encoded  sensor  images.  At  inference  time,  flag  deviations  from  the  learned  normal manifold and explain every anomaly with sensor-level and timestep-level attribution maps.

## 4.2 System Architecture Overview

The pipeline proceeds in five stages:

1. Raw sensor streams are normalized and windowed into overlapping temporal segments.

2. Each segment is converted into a Gramian Angular Field (GAF) image, producing a 2D spatial representation of temporal self-similarity and inter-sensor correlation.
3. A CNN encoder trained with SoftCLT loss embeds each GAF image into a compact latent vector, forming the representation space of the digital twin.
4. An anomaly scoring module (Variational Autoencoder or latent-space distance metric) computes deviation scores by comparing incoming latent representations to the learned normal distribution.
5. An XAI attribution layer applies Grad-CAM to the CNN encoder and SHAP to the scoring module, generating visual and tabular explanations identifying responsible sensors and time windows.

## 4.3 Key Design Decisions

| Self-supervised training   | Eliminates the need for labeled attack data. The system learns purely from normal operating conditions, making it deployable on new ICS installations immediately.                                                                   |
|----------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Soft contrastive loss      | Unlike hard positive/negative pair assignment, SoftCLT uses continuous similarity weights between pairs, preserving temporal ordering and handling noisy sensor readings gracefully.                                                 |
| GAF encoding               | Converts 1D time signals to 2D images, enabling powerful CNN feature extraction. The GAF matrix captures temporal self-correlation, preserving the sequential structure lost by standard augmentation.                               |
| Digital twin paradigm      | The encoder learns to represent the system's normal behavior. Any input that maps to an out-of-distribution region of the latent space is flagged as anomalous -no attack signatures needed.                                         |
| Dual XAI layer             | Grad-CAM operates on the CNN spatial feature maps to identify which part of the GAF image (i.e., which time window) triggered the anomaly. SHAP operates on the anomaly scorer to attribute the alarm to individual sensor channels. |

## Novelty Dimensions

## 5.1 Novelty 1 - SoftCLT for Industrial Time-Series

Standard  contrastive  learning  treats  time-series  pairs  as  either  positive  (similar)  or  negative (dissimilar) with binary labels. This hard assignment fails for ICS data because:

- Two time windows from the same sensor during normal operation may have partial similarity depending on process state.
- Augmentations like jitter or scaling change the similarity structure in ways that do not reflect real-world conditions.
- Hard negatives in ICS are often borderline cases (e.g., sensor drift) that should not be repelled in the latent space.

SoftCLT replaces binary pair labels with continuous similarity weights w(i,j) ∈ [0,1] derived from the temporal distance and DTW-based similarity between windows. The contrastive loss becomes:

## SoftCLT Loss Function (Conceptual)

L\_soft = Σ\_{i,j} w(i,j) · L\_contrastive(z\_i, z\_j)  where w(i,j) reflects temporal proximity and sensor correlation.  Temporally  adjacent  windows  receive  high  positive  weights;  distant  or  dissimilar windows receive negative weights proportional to their dissimilarity score.

## 5.2 Novelty 2 - Learned Digital Twin via Latent Space

Unlike  physics-based  digital  twins  that  require  manual  modeling of system dynamics, XCDT-ICS learns  the  digital  twin  implicitly  from  data.  The  encoder  φ:  X  →  Z  is  trained  to  compress  normal operating windows into a low-dimensional latent manifold. The digital twin is therefore defined as the learned distribution P(Z | normal).

At  inference,  an  incoming  window x* is encoded to z* = φ(x*). Anomaly score A(x*) = d(z*, P(Z | normal)), where d is either reconstruction error from a VAE decoder, Mahalanobis distance from the normal cluster centroid, or k-NN distance in latent space. The threshold θ is tuned on a validation set drawn from normal operations to enforce a target FPR.

## 5.3 Novelty 3 - Multivariate GAF Encoding

Gramian Angular Fields encode a 1D time series s = {s1, ..., sT} as a 2D matrix G where G[i,j] = cos(θ\_i + θ\_j), with θ = arccos(s\_normalized). For N sensors, the proposed pipeline generates N individual GAF matrices and stacks them as a multi-channel image, analogous to RGB channels in computer  vision.  This  enables  the  CNN  encoder  to  learn  cross-sensor  patterns  in  the  spatial domain.

The  composite  GAF  image  I ∈ R^{N  ×  T  ×  T}  is  processed  by  a  convolutional  encoder  with depth-wise separable convolutions to capture both within-sensor temporal correlation (within each channel) and cross-sensor interaction patterns (across channels via grouped convolutions).

## 5.4 Novelty 4 - Integrated Dual XAI Attribution

The XAI layer provides two complementary levels of explanation:

## Temporal Attribution via Grad-CAM

Grad-CAM  computes  a  weighted  sum  of  CNN feature map activations using the gradient of the anomaly score with respect to the final convolutional layer. This produces a spatial heatmap over the GAF image, which is decoded back to a temporal saliency map. This directly answers: "During which time window did the anomaly occur?"

## Sensor Attribution via SHAP

SHAP  (SHapley  Additive  exPlanations)  is  applied  to  the  anomaly  scoring  function,  with  sensor channels  as  input  features.  This  quantifies  each  sensor's  marginal  contribution  to  the  anomaly score.  The  output  is  a  ranked  list  of  sensors  ordered  by  their  contribution  magnitude,  directly answering: "Which sensor is responsible for this alarm?"

## Operator-Facing Explanation Format

ALARM TRIGGERED at 14:23:07 UTCAnomaly Score: 0.84 (Threshold: 0.65)Top Contributing Sensors: P-302 (flow, 41%), MV-101 (actuator, 33%), LIT-301 (level, 18%)Critical Time Window: [14:22:45 - 14:23:05] UTCVisual Heatmap: [attached GAF saliency map]

## 6. Methodology

## 6.1 Data Pipeline

## Step 1 - Data Ingestion and Normalization

Raw sensor readings from SWaT and WADI datasets are loaded as multivariate time-series. Each sensor channel is independently normalized using z-score normalization computed exclusively from the training  split  (normal  operation  data)  to avoid data leakage. Missing values are imputed using linear interpolation; persistent gaps beyond 5 seconds are flagged.

## Step 2 - Sliding Window Segmentation

Data  is  segmented  into  overlapping  windows  of  length  W  =  60  timesteps  (60  seconds at 1 Hz sampling)  with  stride  S  =  10  timesteps.  This  produces  dense coverage of the time series while ensuring sufficient temporal context for pattern learning. Window  length  is treated as a hyperparameter and ablated.

## Step 3 - GAF Transformation

Each normalized window segment for each sensor is transformed to polar coordinates via arccos mapping, then the Gramian Angular Summation Field (GASF) is computed. The N sensor GASF matrices are stacked into a multi-channel tensor of shape [N, W, W]. An optional Gramian Angular Difference  Field  (GADF)  stack  may  be  concatenated  to  double  the  channel  count,  providing complementary temporal trend information.

## 6.2 Model Architecture

## CNN Encoder

|   Layer | Type         | Configuration              | Output Shape   |
|---------|--------------|----------------------------|----------------|
|       1 | Conv2D Block | 32 filters, 3×3, ReLU + BN | [B, 32, W, W]  |

|   2 | Conv2D Block        | 64 filters, 3×3, ReLU + BN   | [B, 64, W/2, W/2]   |
|-----|---------------------|------------------------------|---------------------|
|   3 | Depthwise Sep. Conv | 128 filters, 3×3             | [B, 128, W/4, W/4]  |
|   4 | Global Avg Pooling  | -                            | [B, 128]            |
|   5 | Projection Head     | FC 128→128, ReLU, FC 128→D   | [B, D]              |

## Anomaly Scoring Module (Options)

- Option A - VAE Decoder: Reconstruct input GAF from latent vector. Anomaly score = mean squared reconstruction error.
- Option B - Latent Distance: Compute Mahalanobis distance from the Gaussian fit to the training-set latent distribution.
- Option C - k-NN in Latent Space: Distance to k-th nearest neighbor in the stored normal training embeddings.

Options are evaluated comparatively. The final model selection is based on validation FPR and F1 score.

## 6.3 Training Protocol

| Training Data     | Normal operation windows only (no attack labels used during training)                       |
|-------------------|---------------------------------------------------------------------------------------------|
| Loss Function     | SoftCLT loss with temporal-proximity soft weights                                           |
| Optimizer         | AdamW with cosine annealing LR schedule                                                     |
| Learning Rate     | 1e-3 initial, min 1e-5                                                                      |
| Batch Size        | 256 window pairs                                                                            |
| Epochs            | 100 with early stopping (patience = 10)                                                     |
| Data Augmentation | Gaussian noise (σ=0.01), temporal scaling (×0.9-1.1) - applied softly, not to destroy order |
| Threshold Tuning  | FPR-controlled threshold calibration on held-out normal validation set                      |
| Hardware          | GPU: NVIDIA RTX 3090 or equivalent (PyTorch)                                                |

## 6.4 XAI Integration

## Grad-CAM Implementation

- Hook registered on final CNN convolutional layer.
- Gradient of anomaly score with respect to feature map activations is computed.

- Activation map weighted by global-average-pooled gradients.
- Upsampled to original GAF resolution and decoded to temporal saliency.

## SHAP Integration

- KernelSHAP applied with sensor channels as features.
- Background distribution sampled from normal training windows.
- Shapley values computed per sensor per anomalous window.
- Output: ranked sensor attribution with confidence intervals.

## 6.5 Real-Time Replay Simulation

## What We Are Simulating

We  do  not  simulate  a  physical  ICS  plant  from  scratch.  Instead,  we  perform  a  live  replay simulation: the SWaT/WADI dataset - recorded from a real operational water treatment facility - is streamed row by row at configurable speed, replicating what it would look like if XCDT-ICS were  deployed  in  production.  The  digital  twin  runs  in  parallel,  continuously  updating  its expectation of normal behaviour. This is the standard and accepted method for validating ICS anomaly detection systems in the research community.

The  replay  simulation  works as follows. The SWaT dataset contains 7 days of normal operation followed  by  4  days  of  recorded  attacks  at  1  Hz  (one  sensor  reading  per  second  across  all  51 sensors). During the demo, a Python replay engine reads each timestep sequentially and emits it to the  inference  pipeline  exactly  as  a  live  sensor  feed  would.  The  system  has  no  access  to  future readings  -  each  decision  is  made  with  only  the  current  and  past  windows  available,  faithfully reproducing the online deployment scenario.

The replay speed is configurable. For the live demonstration, 10x acceleration is used - meaning one hour of plant operation is replayed in six minutes, allowing examiners to observe the system across  both  normal  operation  (flat  anomaly  score)  and  attack  windows  (score  spike, alert fires, explanation renders) within a single demo session.

## What the Digital Twin Does During Replay

At every timestep t, the digital twin performs three operations in sequence:

6. Encode: The current window [t-W, t] is converted to a GAF image and passed through the CNN encoder to produce a latent vector z\_t.
7. Score: The anomaly scorer computes the deviation of z\_t from the learned normal distribution P(Z | normal). This yields a scalar anomaly score A\_t.
8. Alert: If A\_t exceeds the calibrated threshold θ, an alert is triggered. Grad-CAM and SHAP run automatically on the flagged window, producing sensor attribution and time saliency within approximately 1-2 seconds.

Between  alerts,  the  system  displays  real-time  sensor  readings  and  the  digital  twin's  expected values  side-by-side,  making  the  deviation  visually  interpretable  even  before  the  anomaly  score crosses threshold. This mirrors exactly what an operator would see in a real deployment.

## 6.6 Dashboard - Real-Time Operator Interface

The  operator-facing  dashboard  is  built  using  Streamlit,  a  Python  web framework that integrates natively  with  PyTorch  and  Matplotlib.  It  serves  as  the  primary  demonstration  artefact  shown  to examiners and has four panels:

## Panel 1 - Live Sensor Feed

A scrolling multi-line  chart  of  all  active  sensor  readings  updating  in  real  time  during  replay. Each sensor  channel  is  colour-coded  by  type  (flow,  pressure,  level,  actuator  state).  The  digital  twin's predicted normal value is overlaid as a dashed line, making deviations immediately visible before the anomaly scorer flags them.

## Panel 2 - Anomaly Score Timeline

A  continuously  updating  line  chart  showing  anomaly  score  A\_t  over  the  last  300  timesteps.  A horizontal  red  dashed  line  marks  the  detection  threshold.  The background shades green during normal  operation  and red during any active alert window. When the score crosses threshold the alert panel populates automatically.

## Panel 3 - Alert &amp; Explanation Panel

When an anomaly is detected, this panel renders within 1-2 seconds:

- Alert header: timestamp, anomaly score, and severity level (Low / Medium / High).
- SHAP bar chart: sensors ranked by Shapley contribution. Bars coloured orange for positive contributors (anomalous) and blue for suppressors.
- Grad-CAM heatmap: the GAF image of the flagged window with saliency overlay, x-axis decoded to wall-clock timestamps so operators read it as a timeline.
- Plain-language summary: auto-generated statement such as - Sensor P-302 (flow) showed abnormal behaviour between 14:22:45 and 14:23:05 UTC, contributing 41% of the anomaly signal. Possible actuator manipulation detected.

## Panel 4 - Baseline Comparison (Static Reference)

A pre-computed results table comparing XCDT-ICS against all six baselines on SWaT and WADI. Key metrics (F1, FPR, AUC-ROC) are colour-highlighted so examiners can situate the live demo within the quantitative evaluation without switching screens.

## Dashboard Technical Stack

| Framework      | Streamlit -Python-native, no frontend code required                |
|----------------|--------------------------------------------------------------------|
| Charts         | Plotly (interactive, live updating) + Matplotlib (static heatmaps) |
| Model Backend  | PyTorch inference engine with pre-loaded model checkpoint          |
| Replay Engine  | Custom Python thread reading CSV row-by-row at configurable Hz     |
| XAI Rendering  | pytorch-grad-cam for heatmaps, shap library for bar charts         |
| Update Rate    | Dashboard refreshes every 1 second during replay                   |
| Deployment     | Runs locally on demo laptop; no internet connection required       |
| Estimated Code | ~300 lines Python for full dashboard on top of trained model       |

## Examiner Demo Flow - Step by Step

Step 1: Presenter clicks Start Replay. Live sensor readings begin scrolling on Panel 1. Anomaly score  flatlines  near  zero  confirming  normal  operation.Step  2:  Replay  reaches  a  known  attack window (e.g., SWaT Attack #7 - actuator MV-101 manipulated). Anomaly score begins rising on  Panel  2.Step  3:  Score  crosses  threshold.  Alert  fires.  Panel  3  populates  with  SHAP  chart, Grad-CAM  heatmap,  and  plain-language  explanation  within  2  seconds.Step  4:  Presenter highlights that the system correctly identified sensor MV-101 as primary contributor - matching the  ground  truth  attack  label  -  without  ever  seeing  a  labeled  attack  during  training.Step  5: Presenter switches to Panel 4 and points to FPR column: XCDT-ICS at 0.03 vs. LSTM-AE at 0.14, demonstrating the false alarm reduction quantitatively to the examiner.

## 7. Datasets

## 7.1 SWaT - Secure Water Treatment

SWaT is a scaled-down but realistic operational water treatment testbed developed by the iTrust Centre for Research in Cyber Security at Singapore University of Technology and Design (SUTD). It reproduces a six-stage water treatment process using real PLCs, sensors, and actuators.

| Sensors / Actuators   | 51 sensors and actuators across 6 treatment stages                            |
|-----------------------|-------------------------------------------------------------------------------|
| Sampling Rate         | 1 Hz (one reading per second)                                                 |
| Normal Data           | 7 days of continuous normal operation                                         |
| Attack Data           | 4 days, 41 distinct attack scenarios                                          |
| Attack Types          | Single-point, multi-point, stealthy replay, and actuator manipulation attacks |
| Data Format           | CSV with timestamp, sensor readings, and binary attack label per row          |
| Access                | Freely available from iTrust research portal (requires registration)          |

## 7.2 WADI - Water Distribution

WADI extends SWaT to a water distribution network, adding complexity through a larger physical footprint,  longer  pipes,  and  more  heterogeneous  sensor  types.  It  presents  a  harder  anomaly detection challenge due to longer attack durations and subtler deviations.

| Sensors / Actuators   | 123 sensors and actuators                                                    |
|-----------------------|------------------------------------------------------------------------------|
| Sampling Rate         | 1 Hz                                                                         |
| Normal Data           | 16 days of continuous normal operation                                       |
| Attack Data           | 2 days, 15 attack scenarios                                                  |
| Attack Types          | Coordinated multi-point attacks, stealth attacks, long-duration slow attacks |
| Data Format           | CSV, same structure as SWaT                                                  |
| Access                | Freely available from iTrust (same portal as SWaT)                           |

## 7.3 Dataset Split Strategy

| Split               | Data Source           | Size               | Purpose                               |
|---------------------|-----------------------|--------------------|---------------------------------------|
| Train               | Normal operation only | 70% of normal data | Self-supervised encoder training      |
| Validation (Normal) | Normal operation only | 15% of normal data | Threshold calibration, early stopping |
| Test (Normal)       | Normal operation only | 15% of normal data | FPR measurement on clean data         |
| Test (Attack)       | Full attack period    | All attack windows | Recall, F1, AUC-ROC measurement       |

## No Label Leakage Guarantee

Attack labels are used ONLY at evaluation time to compute metrics. They are never seen during training, validation, or threshold calibration. The system is evaluated under realistic deployment conditions where operators cannot know in advance what attacks look like.

## 8. Baselines &amp; Comparative Evaluation

## 8.1 Baseline Models

| Baseline         | Category         | Key Characteristics                                 | Weakness Exposed                   |
|------------------|------------------|-----------------------------------------------------|------------------------------------|
| Isolation Forest | Classical ML     | Tree-based anomaly isolation, no temporal modeling  | No time-series awareness           |
| One-Class SVM    | Classical ML     | Kernel-based boundary learning                      | Scalability on high-dim data       |
| LSTM Autoencoder | Deep Learning    | Recurrent encoding, reconstruction error scoring    | Requires longer training; poor FPR |
| CNN Autoencoder  | Deep Learning    | Convolutional reconstruction on raw windows         | No temporal contrastive learning   |
| TS2Vec           | Self-Supervi sed | Hard contrastive learning with random cropping      | Temporal destruction; binary pairs |
| CARLA            | Self-Supervi sed | Contrastive representation learning for time-series | No XAI; binary pair assignment     |

## 8.2 Ablation Variants

To  isolate  the  contribution  of  each  proposed  component,  four  ablation  variants  are  evaluated alongside the full model:

- XCDT-ICS (Full): Complete proposed system.
- Ablation A - No SoftCLT: Replace SoftCLT with standard hard contrastive loss (same encoder, binary pair assignment).
- Ablation B - No GAF: Replace GAF encoding with raw normalized windows fed directly to the encoder.
- Ablation C - No XAI: Full detection pipeline without the Grad-CAM and SHAP attribution layer (detection-only evaluation).
- Ablation D - No Digital Twin: Replace latent-space deviation scoring with a simple reconstruction autoencoder without the contrastive pre-training.

## 9. Evaluation Metrics

## 9.1 Detection Metrics

| Metric              | Formula                             | Why It Matters in ICS                                          |
|---------------------|-------------------------------------|----------------------------------------------------------------|
| Accuracy            | ( TP + TN ) / ( TP + TN + FP + FN ) | Baseline correctness measure; high accuracy alone insufficient |
| Precision           | TP / ( TP + FP )                    | Proportion of alarms that are genuine anomalies                |
| Recall (TPR)        | TP / ( TP + FN )                    | Fraction of actual attacks successfully detected               |
| F1 Score            | 2 · (Prec · Rec) / (Prec + Rec)     | Harmonic mean balancing precision and recall                   |
| False Positive Rate | FP / ( FP + TN )                    | PRIMARY METRIC: operator alarm fatigue driver                  |
| AUC-ROC             | Area under ROC curve                | Threshold-independent discrimination ability                   |
| AUC-PR              | Area under Precision-Recall curve   | Critical for imbalanced attack data                            |

## 9.2 Explainability Metrics

| Faithfulness            | Does removing the top-attributed sensors/timesteps cause a larger drop in anomaly score than removing random ones? Measured by Faithfulness@k.   |
|-------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------|
| Comprehensiveness       | Do the attributed features capture the full explanation? Measured by comprehensiveness score vs. completeness score.                             |
| Operator Evaluation     | Qualitative user study (if feasible) with domain engineers evaluating whether explanations match their intuition about the attacks.              |
| Attribution Consistency | For repeated anomalies of the same attack type, do SHAP and Grad-CAM consistently identify the same sensors and time windows?                    |

## Primary Success Criterion

The system is considered successful if: (1) FPR &lt; 0.05 on normal validation data, (2) F1 score exceeds all baselines on SWaT test set, and (3) SHAP attribution correctly identifies the sensor manipulated in at least 70% of evaluated attack scenarios.

## 10. Tool Stack

## 10.1 Software &amp; Frameworks

| Category            | Tool / Library       | Version   | Purpose                                               |
|---------------------|----------------------|-----------|-------------------------------------------------------|
| Core ML             | PyTorch              | ≥2.0      | Model definition, training loop, gradient computation |
| Core ML             | PyTorch Lightning    | ≥2.0      | Training abstraction, logging, checkpointing          |
| Data Processing     | NumPy                | ≥1.24     | Array operations, window sliding, normalization       |
| Data Processing     | Pandas               | ≥2.0      | Dataset loading, timestamp handling, CSV I/O          |
| GAF Encoding        | pyts                 | ≥0.12     | Gramian Angular Field transformation                  |
| GAF Encoding        | scikit-learn         | ≥1.3      | MinMax scaling, preprocessing utilities               |
| XAI -Grad-CAM       | pytorch-grad-cam     | ≥1.4      | Grad-CAM saliency on CNN layers                       |
| XAI -SHAP           | shap                 | ≥0.43     | KernelSHAP and TreeSHAP attribution                   |
| Anomaly Scoring     | PyTorch (VAE)        | Custom    | Variational Autoencoder reconstruction scoring        |
| Visualization       | Matplotlib / Seaborn | ≥3.7      | Heatmaps, ROC curves, saliency overlays               |
| Visualization       | Plotly               | ≥5.15     | Interactive anomaly dashboards                        |
| Experiment Tracking | Weights & Biases     | Latest    | Hyperparameter logging, run comparison                |
| Contrastive Loss    | Custom SoftCLT       | Custom    | Soft-weight contrastive loss implementation           |
| Evaluation          | scikit-learn metrics | ≥1.3      | F1, AUC-ROC, confusion matrices                       |
| Notebooks           | Jupyter Lab          | ≥4.0      | EDA, visualization, result analysis                   |

## 10.2 Hardware Requirements

| GPU   | NVIDIA RTX 3090 (24GB VRAM) or equivalent - required for CNN training with large batch sizes   |
|-------|------------------------------------------------------------------------------------------------|
| CPU   | 16-core CPU recommended for parallel GAF preprocessing of large sensor arrays                  |
| RAM   | Minimum 32GB - WADI's 123 sensor, 16-day dataset requires large in-memory tensors              |

| Storage      | 500GB SSD - for preprocessed GAF image tensors and model checkpoints   |
|--------------|------------------------------------------------------------------------|
| Cloud Option | Google Colab Pro+, AWS p3.2xlarge, or Paperspace Gradient A100         |

## 10.3 Development Environment

| Language            | Python 3.10+                                                            |
|---------------------|-------------------------------------------------------------------------|
| Environment Manager | Conda (preferred) or venv                                               |
| Version Control     | Git + GitHub / GitLab with DVC for dataset versioning                   |
| CI/CD               | GitHub Actions for automated testing of data pipeline and model loading |
| Container           | Docker image with pinned dependencies for reproducibility               |
| Code Style          | Black formatter, Flake8 linter, type hints throughout                   |

## 11. Experiments

## 11.1 Experiment Design

All  experiments follow a consistent protocol: train on normal data only, evaluate on the combined test  set  containing  both  normal  windows  and  attack  windows,  with  metrics  computed  at  the operating threshold tuned to achieve FPR ≤ 0.05 on normal validation data.

## Experiment 1 - Main Comparison

Train XCDT-ICS and all six baseline models on SWaT training split. Evaluate all on SWaT test split. Report Accuracy, Precision, Recall, F1, FPR, AUC-ROC, and AUC-PR. Repeat on WADI dataset. Statistical significance tested via paired t-test with Bonferroni correction.

## Experiment 2 - Ablation Study

Evaluate four ablation variants (Section 8.2) on SWaT. Report performance delta versus full model to  quantify  each  component's contribution. Specifically, the FPR delta of Ablation A vs. full model isolates SoftCLT's impact on false alarm reduction.

## Experiment 3 - Threshold Sensitivity Analysis

Plot FPR vs. Recall trade-off across threshold values for XCDT-ICS and strongest baseline. Identify the Pareto-optimal operating point. Evaluate robustness to threshold perturbation: how much does F1 degrade if the threshold shifts by ±10%?

## Experiment 4 - XAI Faithfulness Evaluation

For each detected attack in the test set, apply Grad-CAM and SHAP. Compute Faithfulness@k (k = top  3  sensors)  by  masking  the  k  attributed  sensors  and  measuring  score  drop  versus  random masking. Report mean faithfulness score across all attack types.

## Experiment 5 - Attack-Type Disaggregation

For  both  SWaT  and  WADI,  break  down  detection  performance  by  attack category (single-point, multi-point,  stealthy,  long-duration). Identify which attack types XCDT-ICS handles best and worst, providing direction for future work.

## 11.2 Expected Results

## Performance Hypotheses

H1: XCDT-ICS will achieve FPR ≤ 0.05 compared to baselines averaging FPR ≥ 0.12 on SWaT, demonstrating the false-alarm reduction from SoftCLT + Digital Twin design.H2: XCDT-ICS F1 will  exceed  TS2Vec  and  CARLA  by  ≥5  percentage  points  on  SWaT,  attributable  to  GAF encoding and soft contrastive training.H3: SHAP attribution will correctly identify the manipulated sensor in ≥70% of single-point attack scenarios, confirming XAI operational utility.

## 12. Expected Contributions

This project delivers five concrete, publishable contributions:

| Contribution 1   | A novel SoftCLT training objective adapted for multivariate ICS time-series data, preserving temporal structure and inter-sensor correlation through soft pair weighting.                  |
|------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Contribution 2   | A Digital Twin architecture driven by learned latent-space representations, enabling deviation-based anomaly detection without physics-based modeling or attack labels.                    |
| Contribution 3   | A multi-channel Gramian Angular Field encoding pipeline for N-sensor ICS data, enabling CNN-based feature extraction with explicit temporal self-correlation representation.               |
| Contribution 4   | An integrated dual XAI layer combining Grad-CAM temporal attribution and SHAP sensor attribution, producing operator-interpretable anomaly explanations in real time.                      |
| Contribution 5   | A comprehensive benchmark of XCDT-ICS against six baselines and four ablations on SWaT and WADI, establishing new state-of-the-art results on publicly recognized ICS security benchmarks. |

## 12.1 SDG 9 Alignment

## Sustainable Development Goal 9 - Industry, Innovation, and Infrastructure

Target 9.1: Develop quality, reliable, sustainable, and resilient infrastructure. XCDT-ICS directly protects  critical  infrastructure  from  cyber-physical  attacks,  reducing  unplanned  downtime  and ensuring  operational  continuity.Target  9.2:  Promote  inclusive  and  sustainable  industrialization. The  system  enables  smaller  industrial  operators  to  deploy  state-of-the-art  anomaly  detection without requiring labeled attack data or cybersecurity domain expertise, democratizing access to advanced ICS security.

## 13. Publication Plan

## 13.1 Target Venues

| Journal / Conference                        | Impact / Rank   | Fit Rationale                                                                               |
|---------------------------------------------|-----------------|---------------------------------------------------------------------------------------------|
| IEEE Transactions on Industrial Informatics | Q1, IF ≈11.7    | Primary target -directly covers ICS, cyber-physical security, and ML for industrial systems |
| Applied Soft Computing                      | Q1, IF ≈8.3     | Strong fit for contrastive learning and XAI in applied engineering domains                  |
| IEEE Internet of Things Journal             | Q1, IF ≈10.6    | Covers ICS as IoT-adjacent systems; high readership in industrial sensing                   |
| Information Sciences                        | Q1, IF ≈8.1     | Broad ML and AI venue; suitable for the self-supervised learning and XAI contributions      |
| ICDM / AAAI (Conference)                    | A* / A Ranked   | Backup venue for fast publication of core contrastive learning contribution                 |

## 13.2 Publication Rationale

- ICS cybersecurity is a high-priority research domain with increasing publications post-2020 due to high-profile attacks (e.g., Colonial Pipeline, Oldsmar water plant).
- Contrastive learning for time-series is a rapidly growing subfield, and SoftCLT is a recent (2023) contribution with limited follow-up work - providing clear novelty space.
- XAI in safety-critical systems is a mandated priority in multiple national AI regulations, making this work highly relevant to policy and industry.
- SWaT and WADI are established benchmarks accepted by top-tier venues, ensuring reviewers can situate and compare the results.

## 14. Four-Month Project Plan

| Month   | Phase                    | Tasks                                                                                                                                                                                                                                                                                       | Deliverable                                                                |
|---------|--------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------|
| Month 1 | Foundatio n              | Literature review (SoftCLT, GAF, ICS anomaly detection, XAI). Dataset acquisition and preprocessing pipeline. EDA on SWaT and WADI. Baseline models: Isolation Forest, One-Class SVM, LSTM-AE, CNN-AE implementation and evaluation.                                                        | Preprocessed datasets, baseline results table, literature review notes     |
| Month 2 | Core Pipeline            | GAF encoding pipeline for multivariate sensor streams. CNN encoder architecture design and implementation. SoftCLT loss function implementation with temporal soft weights. Initial contrastive pre-training runs on SWaT.                                                                  | Working GAF pipeline, trained CNN encoder, SoftCLT loss validated          |
| Month 3 | Training & Evaluation    | Full XCDT-ICS training on SWaT and WADI. Anomaly scoring module implementation and comparison (VAE vs. distance). Threshold calibration. Ablation experiments. Comparison against TS2Vec and CARLA baselines.                                                                               | Full results table, ablation report, model checkpoints                     |
| Month 4 | XAI, Dashboard & Writing | Grad-CAM integration and temporal saliency decoding. SHAP attribution and faithfulness evaluation. Streamlit dashboard: replay engine, 4-panel layout, live charts, alert rendering with SHAP and Grad-CAM. End-to-end demo rehearsal on SWaT attack windows. Paper writing and submission. | Live demo dashboard, faithfulness evaluation report, final paper submitted |

## 14.1 Risk Register

| Risk                                         | Likeliho od   | Impact   | Mitigation                                                                 |
|----------------------------------------------|---------------|----------|----------------------------------------------------------------------------|
| GAF encoding too slow for WADI (123 sensors) | Medium        | High     | Pre-compute and cache all GAF tensors; use parallel CPU processing         |
| SoftCLT loss unstable during training        | Medium        | High     | Implement gradient clipping; start with hard CL and anneal to soft weights |
| XAI explanations not faithful enough         | Low           | Medium   | Fall back to Integrated Gradients as alternative; reduce CNN depth         |
| SWaT/WADI access delayed                     | Low           | High     | Pre-register with iTrust in Month 1; use BATADAL as interim benchmark      |

| Baseline TS2Vec/CARLA outperforms on SWaT   | Low   | Medium   | Ablate further; emphasize FPR reduction as primary claim; add WADI results   |
|---------------------------------------------|-------|----------|------------------------------------------------------------------------------|

## 15. SDG Alignment

## SDG 9 - Industry, Innovation and Infrastructure

SDG 9 is the direct and sole alignment for this project. All three relevant targets are addressed:

| Target 9.1   | Develop reliable, sustainable and resilient infrastructure. XCDT-ICS directly protects water plants, power grids, and manufacturing lines from cyber-physical attacks that cause unplanned downtime, equipment damage, and service disruption.                                                                                  |
|--------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Target 9.4   | Upgrade infrastructure with cleaner and more environmentally sound technologies. Undetected attacks on chemical plants or water systems can trigger hazardous substance releases. Early anomaly detection with low false positives prevents the environmental consequences of both attacks and unnecessary emergency shutdowns. |
| Target 9.B   | Support domestic technology development in industrial sectors. The self-supervised, label-free design allows deployment without specialist attack datasets or cybersecurity domain expertise -lowering the barrier for smaller operators and developing economies.                                                              |

## 16. Conclusion

XCDT-ICS addresses a critical unmet need in industrial cybersecurity: an anomaly detection system that is self-supervised (requiring no labeled attacks), low-false-positive (suitable for operator trust), explainable  (providing  actionable  sensor-level  and  timestep-level  attributions),  and demonstrable through  a  live  replay  simulation  dashboard. The integration of SoftCLT, Gramian Angular Fields, Digital  Twin  architecture,  dual  XAI  attribution,  and  a  Streamlit  operator  dashboard  represents  a complete end-to-end research and demonstration system.

The  real-time  replay  simulation  using  SWaT  attack  data  ensures  the  project  has  a  compelling, examinable  artefact  beyond  metrics  tables.  Examiners  will  observe  the  system  detecting  a  real recorded attack, see the explanation render in under two seconds, and compare the false positive rate quantitatively against six baselines - all within a single 15-minute demonstration session.

The  system  is  rigorously  grounded  in  public,  widely-accepted  benchmarks  from iTrust, ensuring reproducibility and comparability. The four-month timeline is realistic and de-risked by early baseline implementation, pre-registered dataset access, and a modular build sequence where the dashboard is  constructed  on  top  of  a  fully  trained  and  evaluated  model.  SDG  9  alignment  is  concrete  and directly traceable through the protection of critical industrial infrastructure.

## Contact &amp; Next Steps

Immediate actions upon project approval:1. Submit iTrust dataset access request for SWaT and WADI.2.  Set  up  Git  repository  with  DVC  pipeline  and  Docker  environment.3.  Begin  literature review  with  focus  on  SoftCLT  (2023),  TS2Vec  (2022),  and  recent  ICS  anomaly  detection surveys.4.  Implement  and  evaluate  Isolation  Forest  and  LSTM-AE baselines as performance anchors by end of Week 2.5. Prototype the Streamlit dashboard skeleton (layout only, no model) in parallel with Month 2 pipeline work.