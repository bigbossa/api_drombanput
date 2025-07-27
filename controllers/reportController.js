require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.getReportData = async (req, res) => {
  const { type } = req.params;

  try {
    if (type === "rooms") {
      const { data, error } = await supabase.from("rooms").select("room_type");
      if (error) throw error;

      const result = {};
      data.forEach((r) => {
        result[r.room_type] = (result[r.room_type] || 0) + 1;
      });

      return res.json(
        Object.entries(result).map(([name, value], index) => ({
          name,
          value,
          color: colors[index % colors.length],
        }))
      );
    }

    if (type === "repairs") {
      const { data, error } = await supabase.from("repairs").select("status");
      if (error) throw error;

      const result = {};
      data.forEach((r) => {
        result[r.status] = (result[r.status] || 0) + 1;
      });

      return res.json(
        Object.entries(result).map(([name, value], index) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
          color: colors[index % colors.length],
        }))
      );
    }

    if (type === "occupancy") {
      const { data: roomsData } = await supabase.from("rooms").select("id");
      const totalRooms = roomsData.length;
      const today = new Date();
      const results = [];

      for (let i = 11; i >= 0; i--) {
        const target = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const month = target.toLocaleDateString("en-US", { month: "short" });

        const start = new Date(target.getFullYear(), target.getMonth(), 1).toISOString().split("T")[0];
        const end = new Date(target.getFullYear(), target.getMonth() + 1, 0).toISOString().split("T")[0];

        const { data, error } = await supabase
          .from("occupancy")
          .select("room_id")
          .lte("check_in_date", end)
          .or(`check_out_date.is.null,check_out_date.gte.${start}`);

        const rate = totalRooms ? Math.round((data.length / totalRooms) * 100) : 0;

        results.push({ month, occupancy: rate });
      }

      return res.json(results);
    }

    if (type === "revenue") {
      const today = new Date();
      const results = [];

      for (let i = 11; i >= 0; i--) {
        const target = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const month = target.toLocaleDateString("en-US", { month: "short" });

        const start = new Date(target.getFullYear(), target.getMonth(), 1).toISOString().split("T")[0];
        const end = new Date(target.getFullYear(), target.getMonth() + 1, 0).toISOString().split("T")[0];

        const { data, error } = await supabase
          .from("billing")
          .select("sum")
          .gte("billing_month", start)
          .lte("billing_month", end);

        const sum = data?.reduce((acc, cur) => acc + Number(cur.sum), 0) || 0;
        results.push({ month, revenue: sum });
      }

      return res.json(results);
    }

    if (type === "events") {
      const today = new Date();
      const results = [];

      for (let i = 11; i >= 0; i--) {
        const target = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const month = target.toLocaleDateString("en-US", { month: "short" });

        const start = new Date(target.getFullYear(), target.getMonth(), 1).toISOString().split("T")[0];
        const end = new Date(target.getFullYear(), target.getMonth() + 1, 0).toISOString().split("T")[0];

        const { data: events, error: eventsError } = await supabase
          .from("events")
          .select("id")
          .gte("event_date", start)
          .lte("event_date", end);

        const ids = events.map((e) => e.id);
        let totalAttendees = 0;

        if (ids.length) {
          const { data: attendance } = await supabase
            .from("event_attendance")
            .select("id")
            .in("event_id", ids)
            .eq("attended", true);

          totalAttendees = attendance.length;
        }

        const avg = ids.length ? Math.round(totalAttendees / ids.length) : 0;
        results.push({ month, events: ids.length, attendees: totalAttendees, averageAttendance: avg });
      }

      return res.json(results);
    }

    return res.status(400).json({ error: "Invalid report type" });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const colors = ["#3b82f6", "#10b981", "#f59e0b", "#6366f1", "#ec4899", "#64748b"];
