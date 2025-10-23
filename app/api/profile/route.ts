import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import bcrypt from 'bcryptjs';

// Função getCurrentUser simplificada para desenvolvimento
async function getCurrentUser(request?: NextRequest): Promise<{ id: number } | null> {
  // Para desenvolvimento, vamos usar um usuário padrão (ID 1)
  // Em produção, isso seria substituído pela autenticação real
  return { id: 1 };
}

// GET - Buscar dados do perfil do usuário atual
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Buscar dados completos do usuário
    const [userRows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        u.id,
        u.username,
        u.email,
        u.full_name as name,
        u.phone,
        u.department,
        u.is_active as isActive,
        u.is_admin,
        u.created_at as createdAt,
        u.last_login as lastLogin,
        GROUP_CONCAT(DISTINCT r.name ORDER BY r.name SEPARATOR ',') as roles
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN roles r ON ur.role_id = r.id
       WHERE u.id = ?
       GROUP BY u.id`,
      [currentUser.id]
    );

    if (userRows.length === 0) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const user = userRows[0];

    // Buscar preferências do usuário
    const [prefRows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        theme,
        language,
        notifications_enabled,
        dashboard_layout,
        items_per_page,
        timezone,
        primary_color,
        interface_size,
        border_radius,
        show_animations,
        compact_sidebar,
        show_breadcrumbs,
        high_contrast
       FROM user_preferences
       WHERE user_id = ?`,
      [currentUser.id]
    );

    const preferences = prefRows.length > 0 ? prefRows[0] : {
      theme: 'light',
      language: 'pt-BR',
      notifications_enabled: true,
      email_notifications: true,
      dashboard_layout: 'default',
      items_per_page: 25,
      timezone: 'America/Sao_Paulo',
      primary_color: '#3b82f6',
      interface_size: 'medium',
      border_radius: 'medium',
      show_animations: true,
      compact_sidebar: false,
      show_breadcrumbs: true,
      high_contrast: false
    };

    return NextResponse.json({
      user: {
        id: user.id.toString(),
        username: user.username,
        email: user.email,
        name: user.name,
        phone: user.phone || '',
        department: user.department || '',
        role: user.is_admin ? 'ADMIN' : 'USUARIO',
        isActive: Boolean(user.isActive),
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      },
      preferences: {
        theme: preferences.theme || 'light',
        language: preferences.language || 'pt-BR',
        notifications: Boolean(preferences.notifications_enabled),
        emailNotifications: true, // Campo não existe na tabela atual
        dashboardLayout: preferences.dashboard_layout || 'default',
        itemsPerPage: preferences.items_per_page || 25,
        timezone: preferences.timezone || 'America/Sao_Paulo',
        primaryColor: preferences.primary_color || '#3b82f6',
        interfaceSize: preferences.interface_size || 'medium',
        borderRadius: preferences.border_radius || 'medium',
        showAnimations: Boolean(preferences.show_animations),
        compactSidebar: Boolean(preferences.compact_sidebar),
        showBreadcrumbs: Boolean(preferences.show_breadcrumbs),
        highContrast: Boolean(preferences.high_contrast)
      }
    });

  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    console.error('Stack trace:', error.stack);
    return NextResponse.json(
      { error: 'Erro ao buscar perfil', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Atualizar dados do perfil do usuário atual
export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { user: userData, preferences: preferencesData } = data;

    // Atualizar dados do usuário se fornecidos
    if (userData) {
      const { name, email, phone, department } = userData;
      const updates: string[] = [];
      const values: any[] = [];

      if (name && name.trim()) {
        updates.push('full_name = ?');
        values.push(name.trim());
      }

      if (email && email.trim()) {
        // Verificar se email já existe para outro usuário
        const [existingEmail] = await pool.execute<RowDataPacket[]>(
          'SELECT id FROM users WHERE email = ? AND id != ?',
          [email.trim(), currentUser.id]
        );

        if (existingEmail.length > 0) {
          return NextResponse.json(
            { error: 'Este email já está sendo usado por outro usuário' },
            { status: 400 }
          );
        }

        updates.push('email = ?');
        values.push(email.trim());
      }

      if (phone !== undefined) {
        updates.push('phone = ?');
        values.push(phone?.trim() || null);
      }

      if (department !== undefined) {
        updates.push('department = ?');
        values.push(department?.trim() || null);
      }

      if (updates.length > 0) {
        values.push(currentUser.id);
        await pool.execute(
          `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
          values
        );
      }
    }

    // Atualizar preferências se fornecidas
    if (preferencesData) {
      const {
        theme,
        language,
        notifications,
        dashboardLayout,
        itemsPerPage,
        timezone,
        primaryColor,
        interfaceSize,
        borderRadius,
        showAnimations,
        compactSidebar,
        showBreadcrumbs,
        highContrast
      } = preferencesData;

      // Verificar se já existem preferências
      const [existing] = await pool.execute<RowDataPacket[]>(
        'SELECT id FROM user_preferences WHERE user_id = ?',
        [currentUser.id]
      );

      if (existing.length === 0) {
        // Criar novas preferências
        await pool.execute(
          `INSERT INTO user_preferences (
            user_id, theme, language, notifications_enabled, email_notifications,
            dashboard_layout, items_per_page, timezone, primary_color,
            interface_size, border_radius, show_animations, compact_sidebar,
            show_breadcrumbs, high_contrast, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            currentUser.id,
            theme || 'light',
            language || 'pt-BR',
            notifications !== undefined ? notifications : true,
            true, // emailNotifications - valor padrão fixo
            dashboardLayout || 'default',
            itemsPerPage || 25,
            timezone || 'America/Sao_Paulo',
            primaryColor || '#3b82f6',
            interfaceSize || 'medium',
            borderRadius || 'medium',
            showAnimations !== undefined ? showAnimations : true,
            compactSidebar !== undefined ? compactSidebar : false,
            showBreadcrumbs !== undefined ? showBreadcrumbs : true,
            highContrast !== undefined ? highContrast : false
          ]
        );
      } else {
        // Atualizar preferências existentes
        const prefUpdates: string[] = [];
        const prefValues: any[] = [];

        if (theme !== undefined) {
          prefUpdates.push('theme = ?');
          prefValues.push(theme);
        }

        if (language !== undefined) {
          prefUpdates.push('language = ?');
          prefValues.push(language);
        }

        if (notifications !== undefined) {
          prefUpdates.push('notifications_enabled = ?');
          prefValues.push(notifications);
        }

        // emailNotifications removido - não será mais atualizado

        if (dashboardLayout !== undefined) {
          prefUpdates.push('dashboard_layout = ?');
          prefValues.push(dashboardLayout);
        }

        if (itemsPerPage !== undefined) {
          prefUpdates.push('items_per_page = ?');
          prefValues.push(itemsPerPage);
        }

        if (timezone !== undefined) {
          prefUpdates.push('timezone = ?');
          prefValues.push(timezone);
        }

        if (primaryColor !== undefined) {
          prefUpdates.push('primary_color = ?');
          prefValues.push(primaryColor);
        }

        if (interfaceSize !== undefined) {
          prefUpdates.push('interface_size = ?');
          prefValues.push(interfaceSize);
        }

        if (borderRadius !== undefined) {
          prefUpdates.push('border_radius = ?');
          prefValues.push(borderRadius);
        }

        if (showAnimations !== undefined) {
          prefUpdates.push('show_animations = ?');
          prefValues.push(showAnimations);
        }

        if (compactSidebar !== undefined) {
          prefUpdates.push('compact_sidebar = ?');
          prefValues.push(compactSidebar);
        }

        if (showBreadcrumbs !== undefined) {
          prefUpdates.push('show_breadcrumbs = ?');
          prefValues.push(showBreadcrumbs);
        }

        if (highContrast !== undefined) {
          prefUpdates.push('high_contrast = ?');
          prefValues.push(highContrast);
        }

        if (prefUpdates.length > 0) {
          prefUpdates.push('updated_at = NOW()');
          prefValues.push(currentUser.id);
          await pool.execute(
            `UPDATE user_preferences SET ${prefUpdates.join(', ')} WHERE user_id = ?`,
            prefValues
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Perfil atualizado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar perfil' },
      { status: 500 }
    );
  }
}

// POST - Alterar senha do usuário atual
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Senha atual e nova senha são obrigatórias' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Nova senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Buscar senha atual do usuário
    const [userRows] = await pool.execute<RowDataPacket[]>(
      'SELECT password_hash FROM users WHERE id = ?',
      [currentUser.id]
    );

    if (userRows.length === 0) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Verificar senha atual
    const isValidPassword = await bcrypt.compare(currentPassword, userRows[0].password_hash);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Senha atual incorreta' },
        { status: 400 }
      );
    }

    // Hash da nova senha
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Atualizar senha
    await pool.execute(
      'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
      [newPasswordHash, currentUser.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Senha alterada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    return NextResponse.json(
      { error: 'Erro ao alterar senha' },
      { status: 500 }
    );
  }
}