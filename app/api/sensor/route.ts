import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.json()

  const { error } = await supabase.from('sensor_data').insert([{
    dissolved_oxygen: body.dissolved_oxygen,
    ph: body.ph,
    conductivity: body.conductivity,
    turbidity: body.turbidity,
    temperature: body.temperature,
    latitude: body.latitude,
    longitude: body.longitude,
  }])

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true }, { status: 200 })
}

export async function GET() {
  const { data, error } = await supabase
    .from('sensor_data')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data)
}