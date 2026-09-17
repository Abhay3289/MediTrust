"""
Import every model here so `Base.metadata` is fully populated for Alembic's
`--autogenerate` and so `from app.models import User, Hospital, ...` works
from anywhere else in the app.
"""
from app.models.appointment import Appointment, AppointmentStatus, AppointmentType  # noqa: F401
from app.models.consultation import Consultation, ConsultationStatus  # noqa: F401
from app.models.doctor import Doctor  # noqa: F401
from app.models.health_problem import HealthProblem  # noqa: F401
from app.models.hospital import Hospital  # noqa: F401
from app.models.notification import Notification, NotificationType  # noqa: F401
from app.models.review import Review  # noqa: F401
from app.models.saved_hospital import SavedHospital  # noqa: F401
from app.models.stay import Stay, StayRequest  # noqa: F401
from app.models.user import User, UserRole  # noqa: F401
