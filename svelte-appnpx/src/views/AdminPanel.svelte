<script>
    import { onMount } from "svelte";
    import { navigate } from "svelte-routing";
    import Chart from "chart.js/auto";
    import "chartjs-adapter-date-fns";
    import { db } from "../services/firebase";
    import { ref, get } from "firebase/database";
    import Footer from "./assets/Footer.svelte";

    let users = [];
    let loginTimes = {};
    let deviceCounts = {};

    onMount(async () => {
        const usersRef = ref(db, "users");
        const snapshot = await get(usersRef);
        if (snapshot.exists()) {
            users = Object.entries(snapshot.val()).map(([key, value]) => {
                if (value.analytics && value.analytics.logins) {
                    Object.values(value.analytics.logins).forEach((login) => {
                        const dateTime = new Date(login.date);
                        const dateHour =
                            dateTime.toISOString().slice(0, 13) + ":00:00";
                        loginTimes[dateHour] = (loginTimes[dateHour] || 0) + 1;

                        const deviceMatch = login.device.match(
                            /(Windows|Android|iOS|Mac OS X|Linux)/i,
                        );
                        const device = deviceMatch ? deviceMatch[0] : "Other";
                        deviceCounts[device] = (deviceCounts[device] || 0) + 1;
                    });
                }
                return {
                    id: key,
                    email: value.email,
                    loginCount: value.loginCount,
                    detailsPage: `/user-details/${key}`,
                };
            });

            initCharts();
        }
    });

    function initCharts() {
        const loginTimeCtx = document
            .getElementById("loginTimeChart")
            .getContext("2d");
        new Chart(loginTimeCtx, {
            type: "line",
            data: {
                labels: Object.keys(loginTimes).sort(),
                datasets: [
                    {
                        label: "Logins",
                        data: Object.values(loginTimes),
                        borderColor: "rgb(78, 185, 159)",
                        backgroundColor: "rgba(78, 185, 159, 0.15)",
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: "rgb(78, 185, 159)",
                        pointRadius: 4,
                    },
                ],
            },
            options: {
                plugins: {
                    legend: {
                        labels: { color: "rgba(255,255,255,0.7)", font: { size: 12 } },
                    },
                },
                scales: {
                    x: {
                        type: "time",
                        time: {
                            unit: "hour",
                            tooltipFormat: "yyyy-MM-dd HH:mm",
                            displayFormats: { hour: "MMM dd, HH:mm" },
                        },
                        ticks: { color: "rgba(255,255,255,0.5)" },
                        grid: { color: "rgba(255,255,255,0.06)" },
                    },
                    y: {
                        ticks: { color: "rgba(255,255,255,0.5)" },
                        grid: { color: "rgba(255,255,255,0.06)" },
                    },
                },
            },
        });

        const deviceChartCtx = document
            .getElementById("deviceChart")
            .getContext("2d");
        new Chart(deviceChartCtx, {
            type: "doughnut",
            data: {
                labels: Object.keys(deviceCounts),
                datasets: [
                    {
                        data: Object.values(deviceCounts),
                        backgroundColor: [
                            "#4eb99f",
                            "#f2b035",
                            "#ed563b",
                            "#122f41",
                            "#8b5cf6",
                            "#64748b",
                        ],
                        borderColor: "rgba(255,255,255,0.1)",
                        borderWidth: 2,
                        hoverOffset: 6,
                    },
                ],
            },
            options: {
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: { color: "rgba(255,255,255,0.7)", padding: 16, font: { size: 12 } },
                    },
                },
            },
        });
    }

    function goToUserPage(page) {
        navigate(page);
    }
</script>

<main class="gradient-bg admin-page">
    <div class="admin-wrapper fade-in">
        <div class="page-header">
            <h1 class="page-title">Admin Dashboard</h1>
            <p class="page-sub">Overview of all users and activity</p>
        </div>

        <!-- Stats row -->
        <div class="stats-row">
            <div class="glass-card stat-widget">
                <div class="stat-num">{users.length}</div>
                <div class="stat-lbl">Total Users</div>
            </div>
            <div class="glass-card stat-widget">
                <div class="stat-num">{Object.values(loginTimes).reduce((a, b) => a + b, 0)}</div>
                <div class="stat-lbl">Total Logins</div>
            </div>
            <div class="glass-card stat-widget">
                <div class="stat-num">{Object.keys(deviceCounts).length}</div>
                <div class="stat-lbl">Device Types</div>
            </div>
        </div>

        <!-- User table -->
        <div class="glass-card table-card">
            <h2 class="section-title">Users</h2>
            <div class="table-scroll">
                <table>
                    <thead>
                        <tr>
                            <th>Email</th>
                            <th>Login Count</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each users as user (user.id)}
                            <tr>
                                <td>{user.email}</td>
                                <td><span class="login-badge">{user.loginCount || 0}</span></td>
                                <td>
                                    <button
                                        class="btn-gold btn-sm"
                                        on:click={() => goToUserPage(user.detailsPage)}
                                    >
                                        View Details
                                    </button>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Charts -->
        <div class="charts-grid">
            <div class="glass-card chart-card">
                <h2 class="section-title">Login Activity Over Time</h2>
                <p class="chart-desc" id="loginChartDesc">Line chart showing the number of user logins grouped by hour</p>
                <div class="chart-wrap">
                    <canvas
                        id="loginTimeChart"
                        role="img"
                        aria-label="Line chart showing login frequency over time"
                        aria-describedby="loginChartDesc"
                    ></canvas>
                </div>
            </div>

            <div class="glass-card chart-card">
                <h2 class="section-title">Logins by Device</h2>
                <p class="chart-desc" id="deviceChartDesc">Doughnut chart showing the distribution of login counts by device type</p>
                <div class="chart-wrap chart-wrap-sm">
                    <canvas
                        id="deviceChart"
                        role="img"
                        aria-label="Doughnut chart showing login counts by device type"
                        aria-describedby="deviceChartDesc"
                    ></canvas>
                </div>
            </div>
        </div>
    </div>
</main>
<Footer />

<style>
    .admin-page {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 40px 24px 60px;
        color: white;
    }

    .admin-wrapper {
        width: 100%;
        max-width: 1100px;
        display: flex;
        flex-direction: column;
        gap: 28px;
    }

    .page-header {
        text-align: left;
    }

    .page-title {
        font-size: clamp(24px, 4vw, 32px);
        font-weight: 700;
        margin: 0 0 4px;
    }

    .page-sub {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.55);
        margin: 0;
    }

    /* ── Stats row ── */
    .stats-row {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
    }

    .stat-widget {
        text-align: center;
        padding: 28px 16px;
    }

    .stat-num {
        font-size: 44px;
        font-weight: 700;
        color: #4eb99f;
        line-height: 1;
        margin-bottom: 6px;
    }

    .stat-lbl {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.5);
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    /* ── User table ── */
    .table-card {
        padding: 24px;
    }

    .table-card:hover {
        transform: none;
    }

    .section-title {
        font-size: 15px;
        font-weight: 600;
        margin: 0 0 16px;
        color: rgba(255, 255, 255, 0.85);
    }

    .table-scroll {
        overflow-x: auto;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        font-size: 14px;
    }

    thead tr {
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    th {
        text-align: left;
        padding: 10px 14px;
        font-size: 11px;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.45);
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    td {
        padding: 12px 14px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        color: rgba(255, 255, 255, 0.8);
    }

    tbody tr:last-child td {
        border-bottom: none;
    }

    tbody tr:hover td {
        background: rgba(255, 255, 255, 0.04);
    }

    .login-badge {
        background: rgba(78, 185, 159, 0.15);
        color: #4eb99f;
        padding: 3px 10px;
        border-radius: 12px;
        font-size: 13px;
        font-weight: 500;
    }

    .btn-sm {
        padding: 7px 16px;
        font-size: 13px;
    }

    /* ── Charts ── */
    .charts-grid {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 20px;
    }

    .chart-card {
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .chart-card:hover {
        transform: none;
    }

    .chart-desc {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.35);
        margin: 0;
    }

    .chart-wrap {
        flex: 1;
        position: relative;
        max-height: 300px;
    }

    .chart-wrap-sm {
        max-height: 260px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    canvas {
        max-width: 100%;
        max-height: 300px;
    }

    /* ── Responsive ── */
    @media (max-width: 768px) {
        .stats-row {
            grid-template-columns: 1fr 1fr;
        }

        .charts-grid {
            grid-template-columns: 1fr;
        }
    }

    @media (max-width: 480px) {
        .stats-row {
            grid-template-columns: 1fr;
        }
    }
</style>
