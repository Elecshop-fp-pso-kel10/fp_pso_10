import { Container } from '@/components/ui/container';
import { fetchWithAuth } from '@/lib/fetch-with-auth';
import { OrdersList } from '@/modules/admin/components/orders-list';
import { Order } from '@apps/shared/types/order';

export default async function AdminOrdersPage() {
  let ordersData: Order[] = [];

  try {
    const response = await fetchWithAuth('/orders');
    if (response.ok) {
      const data = await response.json();
      ordersData = Array.isArray(data) ? data : [];
    } else {
      console.error('Failed to fetch orders, status:', response.status);
    }
  } catch (error) {
    console.error('Error fetching admin orders:', error);
  }

  return (
    <Container>
      <div className="py-10">
        <OrdersList orders={ordersData} />
      </div>
    </Container>
  );
}
